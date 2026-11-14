import { NextResponse } from 'next/server';
import { sendAlertEmail } from '@/lib/email-service';
import { runMlPredictionModel } from '@/lib/ml-detector';

/**
 * Migration Bridge: Directs any legacy dispatch requests to the automated email alert service
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      to,
      message,
      farmerName = 'Local Farmer',
      farmId,
      crop = 'rice',
      nasaSnapshot,
      language = 'sindhi',
    } = body;

    // Normalize recipient to an email address
    const recipientEmail = (to && typeof to === 'string' && to.includes('@'))
      ? to.trim().toLowerCase()
      : `${(farmerName || 'farmer').toLowerCase().replace(/[^a-z0-9]/g, '.')}@sindhfarms.pk`;

    let mlPrediction = body.mlPrediction;
    if (!mlPrediction && nasaSnapshot?.power) {
      mlPrediction = runMlPredictionModel({
        temperatureC: nasaSnapshot.power.temperatureC,
        soilMoisturePercent: nasaSnapshot.power.soilMoisturePercent,
        crop,
        historical7Day: nasaSnapshot.power.historical7Day,
      });
    }

    const emailResult = await sendAlertEmail({
      to: recipientEmail,
      farmerName,
      farmId,
      crop,
      nasaSnapshot,
      mlPrediction,
      advisoryTextEnglish: message,
      advisoryTextSindhi: language === 'sindhi' ? message : undefined,
      advisoryTextUrdu: language === 'urdu' ? message : undefined,
      urgencyLevel: mlPrediction?.predictedRiskLevel || 'HIGH',
      isAutoTriggered: body.isAutoTriggered || false,
    });

    return NextResponse.json({
      success: true,
      mode: emailResult.mode,
      messageId: emailResult.messageId,
      channel: 'email',
      to: recipientEmail,
      carrierNote: `Automated email alert delivered to ${recipientEmail} with ML predictive analytics!`,
      previewHtml: emailResult.previewHtml,
    });
  } catch (error: any) {
    console.error('Dispatch route error:', error);
    return NextResponse.json({ error: error.message || 'Dispatch failed' }, { status: 500 });
  }
}
