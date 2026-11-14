import { NextResponse } from 'next/server';
import { fetchAlerts } from '@/lib/supabase';

export async function GET() {
  try {
    const alerts = await fetchAlerts();
    return NextResponse.json({ success: true, alerts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
