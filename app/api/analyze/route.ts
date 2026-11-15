import { NextResponse } from 'next/server';
import { getFullTelemetry } from '@/lib/nasa';
import { generateAgronomistAdvice } from '@/lib/agronomist';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawLat = typeof body.latitude === 'number' ? body.latitude : body.lat;
    const rawLng = typeof body.longitude === 'number' ? body.longitude : body.lng;
    const lat = typeof rawLat === 'number' && !isNaN(rawLat) ? rawLat : 26.7341; // Default Dadu, Sindh
    const lng = typeof rawLng === 'number' && !isNaN(rawLng) ? rawLng : 67.7795;
    const crop = body.crop || 'rice';
    const farmerName = body.farmerName || 'Local Farmer';

    // 1. Fetch live NASA Open Data (POWER + EONET)
    const telemetry = await getFullTelemetry(lat, lng);

    // 2. Synthesize with AI Agronomist engine
    // Only alert for a natural hazard if it is in the regional proximity of the farm (within 150 km)
    const localThreatEvent = telemetry.eonetEvents.find(
      (ev) => typeof ev.distanceKm === 'number' && ev.distanceKm <= 150
    );
    const closestThreat = localThreatEvent ? localThreatEvent.title : undefined;

    const advice = await generateAgronomistAdvice({
      temperatureC: telemetry.power.temperatureC,
      soilMoisturePercent: telemetry.power.soilMoisturePercent,
      relativeHumidityPercent: telemetry.power.relativeHumidityPercent,
      precipitationMm: telemetry.power.precipitationMm,
      crop,
      farmerName,
      nearbyThreat: closestThreat,
    });

    const isDaduRegion = lat >= 25.5 && lat <= 27.8 && lng >= 66.5 && lng <= 68.8;
    const targetRegion = isDaduRegion
      ? 'Dadu & Indus Basin, Sindh, Pakistan'
      : `${lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`}, ${lng >= 0 ? `${lng.toFixed(2)}°E` : `${Math.abs(lng).toFixed(2)}°W`} (NASA Planetary Grid)`;

    return NextResponse.json({
      success: true,
      coordinates: { lat, lng },
      telemetry,
      advice,
      targetRegion,
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
