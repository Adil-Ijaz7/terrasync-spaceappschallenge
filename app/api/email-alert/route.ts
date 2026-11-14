import { NextResponse } from 'next/server';
import { sendAlertEmail } from '@/lib/email-service';
import { runMlPredictionModel } from '@/lib/ml-detector';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      to,
      farmerName = 'Dadu Smallholder Farmer',
      farmId,
      crop = 'Rice',
      region = 'Dadu, Sindh',
      message,
      advisoryTextEnglish,
      advisoryTextSindhi,
      advisoryTextUrdu,
      nasaSnapshot,
      urgencyLevel = 'HIGH',
      isAutoTriggered = false,
    } = body;

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return NextResponse.json(
        { error: 'Valid farmer email address ("to") is required.' },
        { status: 400 }
      );
    }

    // Run ML prediction if not already precomputed
    let mlPrediction = body.mlPrediction;
    if (!mlPrediction && nasaSnapshot?.power) {
      mlPrediction = runMlPredictionModel({
        temperatureC: nasaSnapshot.power.temperatureC,
        soilMoisturePercent: nasaSnapshot.power.soilMoisturePercent,
        crop,
        historical7Day: nasaSnapshot.power.historical7Day,
      });
    }

    const result = await sendAlertEmail({
      to: to.trim().toLowerCase(),
      farmerName,
      farmId,
      crop,
      region,
      nasaSnapshot,
      mlPrediction,
      advisoryTextEnglish: advisoryTextEnglish || message,
      advisoryTextSindhi,
      advisoryTextUrdu,
      urgencyLevel,
      isAutoTriggered,
    });

    return NextResponse.json({
      success: true,
      mode: result.mode,
      messageId: result.messageId,
      recipientEmail: result.recipientEmail,
      carrierNote: result.summary,
      previewHtml: result.previewHtml,
      previewUrl: result.previewUrl,
      smtpError: result.error,
      mlPredictionSummary: mlPrediction ? {
        trendDirection: mlPrediction.trendDirection,
        predictedDaysToPWP: mlPrediction.predictedDaysToPWP,
        modelConfidence: mlPrediction.modelConfidence,
      } : null,
      timestamp: result.timestamp,
    });

  } catch (error: any) {
    console.error('Email alert dispatch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch email alert' },
      { status: 500 }
    );
  }
}
