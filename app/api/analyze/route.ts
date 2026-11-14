import { NextResponse } from 'next/server';
import { getFullTelemetry } from '@/lib/nasa';
import { generateAgronomistAdvice } from '@/lib/agronomist';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lat = typeof body.lat === 'number' ? body.lat : 26.7341; // Default Dadu, Sindh
    const lng = typeof body.lng === 'number' ? body.lng : 67.7795;
    const crop = body.crop || 'rice';
    const farmerName = body.farmerName || 'Local Farmer';

    // 1. Fetch live NASA Open Data (POWER + EONET)
    const telemetry = await getFullTelemetry(lat, lng);

    // 2. Synthesize with AI Agronomist engine
    const closestThreat = telemetry.eonetEvents.length > 0 
      ? telemetry.eonetEvents[0].title 
      : undefined;

    const advice = await generateAgronomistAdvice({
      temperatureC: telemetry.power.temperatureC,
      soilMoisturePercent: telemetry.power.soilMoisturePercent,
      crop,
      farmerName,
      nearbyThreat: closestThreat,
    });

    return NextResponse.json({
      success: true,
      coordinates: { lat, lng },
      telemetry,
      advice,
      targetRegion: 'Dadu, Sindh, Pakistan',
      processedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('TerraSync /api/analyze error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process satellite telemetry' },
      { status: 500 }
    );
  }
}
