import { NextResponse } from 'next/server';
import { fetchFarms, createFarm } from '@/lib/supabase';

export async function GET() {
  try {
    const farms = await fetchFarms();
    return NextResponse.json({ success: true, farms });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { farmer_name, email, phone_number, latitude, longitude, region, crop_type } = body;

    const lat = typeof latitude === 'number' ? latitude : parseFloat(latitude);
    const lng = typeof longitude === 'number' ? longitude : parseFloat(longitude);

    if (!farmer_name || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Missing required fields: farmer_name, latitude, longitude' },
        { status: 400 }
      );
    }

    const targetEmail =
      email && typeof email === 'string' && email.includes('@')
        ? email.trim().toLowerCase()
        : phone_number
        ? `${phone_number.replace(/[^0-9]/g, '')}@farmer.pk`
        : `${farmer_name.toLowerCase().replace(/[^a-z0-9]/g, '')}@dadu.farmer.pk`;

    const farm = await createFarm({
      farmer_name: farmer_name.trim(),
      email: targetEmail,
      phone_number: phone_number || undefined,
      latitude: lat,
      longitude: lng,
      region: region || 'Dadu, Sindh',
      crop_type: crop_type || 'Rice (Basmati)',
    });

    return NextResponse.json({ success: true, farm });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
