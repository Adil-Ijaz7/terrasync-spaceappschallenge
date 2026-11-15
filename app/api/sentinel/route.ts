import { NextResponse } from 'next/server';
import { fetchFarms } from '@/lib/supabase';
import { getFullTelemetry } from '@/lib/nasa';
import { generateAgronomistAdvice } from '@/lib/agronomist';
import { runMlDetectiveModel } from '@/lib/ml-detector';
import { sendAlertEmail } from '@/lib/email-service';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const preferredLanguage = body.language || 'sindhi';

    // 1. Fetch registered farm outposts in Dadu District
    const farms = await fetchFarms();
    if (farms.length === 0) {
      return NextResponse.json({ success: false, message: 'No registered farms to scan.' });
    }

    const autoDispatchResults: any[] = [];

    // 2. Scan farms against live NASA POWER & EONET telemetry + ML Predictive Intelligence
    for (const farm of farms) {
      const telemetry = await getFullTelemetry(farm.latitude, farm.longitude);
      const temp = telemetry.power.temperatureC;
      const moisture = telemetry.power.soilMoisturePercent;
      const crop = farm.crop_type || 'Rice';

      // 3. Run ML Detective & Predictive Regression Model
      const mlDetective = runMlDetectiveModel({
        temperatureC: temp,
        soilMoisturePercent: moisture,
        relativeHumidityPercent: telemetry.power.relativeHumidityPercent,
        precipitationMm: telemetry.power.precipitationMm,
        crop,
        historical7Day: telemetry.power.historical7Day,
        nearbyThreat: telemetry.eonetEvents.length > 0 ? telemetry.eonetEvents[0].title : undefined,
      });

      const { prediction } = mlDetective;

      // Trigger condition:
      // A: Critical current observation (temp >= 38 & moisture <= 20, or flood risk, or EONET threat)
      // B: ML predicts Permanent Wilting Point breach in <= 3 days!
      const isCriticalCurrent = (temp >= 38 && moisture <= 20) || moisture >= 75 || telemetry.eonetEvents.length > 0;
      const isPredictedCritical = prediction.predictedDaysToPWP <= 3.0 || prediction.alertRecommended;

      if (isCriticalCurrent || isPredictedCritical) {
        // Generate multilingual advice
        const advice = await generateAgronomistAdvice({
          temperatureC: temp,
          soilMoisturePercent: moisture,
          relativeHumidityPercent: telemetry.power.relativeHumidityPercent,
          precipitationMm: telemetry.power.precipitationMm,
          crop: crop.toLowerCase().includes('wheat') ? 'wheat' : 'rice',
          farmerName: farm.farmer_name,
          nearbyThreat: telemetry.eonetEvents.length > 0 ? telemetry.eonetEvents[0].title : undefined,
        });

        const farmerEmail = farm.email || `${farm.farmer_name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@sindhfarms.pk`;

        // Direct dispatch of automated email alert
        const emailResult = await sendAlertEmail({
          to: farmerEmail,
          farmerName: farm.farmer_name,
          farmId: farm.id,
          crop,
          region: farm.region,
          nasaSnapshot: telemetry,
          mlPrediction: prediction,
          advisoryTextEnglish: advice.englishExplanation,
          advisoryTextSindhi: advice.sindhiText,
          advisoryTextUrdu: advice.urduText,
          urgencyLevel: prediction.predictedRiskLevel,
          isAutoTriggered: true,
        });

        autoDispatchResults.push({
          farmName: farm.farmer_name,
          email: farmerEmail,
          crop,
          triggerReason: isPredictedCritical
            ? `ML Forecast: PWP breach predicted in ${prediction.predictedDaysToPWP} days (${prediction.trendDirection})`
            : `Thermal stress observation (${temp}°C, ${moisture}%)`,
          predictedDaysToPWP: prediction.predictedDaysToPWP,
          modelConfidence: prediction.modelConfidence,
          dispatchStatus: emailResult.success ? 'EMAIL_SENT' : 'FAILED',
          messageId: emailResult.messageId,
          mode: emailResult.mode,
        });
      }
    }

    return NextResponse.json({
      success: true,
      scannedFarms: farms.length,
      triggeredCount: autoDispatchResults.length,
      dispatches: autoDispatchResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Sentinel autonomous dispatch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
