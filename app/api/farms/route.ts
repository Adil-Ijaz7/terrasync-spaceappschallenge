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

    const targetEmail = (email && typeof email === 'string' && email.includes('@'))
      ? email.trim().toLowerCase()
      : (phone_number ? `${phone_number.replace(/[^0-9]/g, '')}@farmer.pk` : null);

    if (!farmer_name || !targetEmail || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: 'Missing required fields: farmer_name, valid email, latitude, longitude' }, { status: 400 });
    }

    const farm = await createFarm({
      farmer_name,
      email: targetEmail,
      phone_number: phone_number || undefined,
      latitude,
      longitude,
      region: region || 'Dadu, Sindh',
      crop_type: crop_type || 'Rice',
    });

    return NextResponse.json({ success: true, farm });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
