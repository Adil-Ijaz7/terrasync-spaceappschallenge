import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ScheduleConfig {
  enabled: boolean;
  dispatchTime: string; // HH:MM (24-hour format)
  timezone: string;
  language: 'sindhi' | 'urdu' | 'english';
  targetScope: 'all_registered_outposts' | 'threatened_only';
  lastDispatchedAt?: string | null;
}

const DEFAULT_SCHEDULE: ScheduleConfig = {
  enabled: true,
  dispatchTime: '06:00', // 06:00 AM (Dawn / Fajr irrigation)
  timezone: 'Asia/Karachi',
  language: 'sindhi',
  targetScope: 'all_registered_outposts',
  lastDispatchedAt: null,
};

const SCHEDULE_FILE_PATH = path.join(process.cwd(), 'lib', 'dispatch-schedule.json');

function readSchedule(): ScheduleConfig {
  try {
    if (fs.existsSync(SCHEDULE_FILE_PATH)) {
      const data = fs.readFileSync(SCHEDULE_FILE_PATH, 'utf-8');
      return { ...DEFAULT_SCHEDULE, ...JSON.parse(data) };
    }
  } catch (err) {
    console.warn('Could not read schedule file, using default:', err);
  }
  return DEFAULT_SCHEDULE;
}

function writeSchedule(config: ScheduleConfig): void {
  try {
    const dir = path.dirname(SCHEDULE_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SCHEDULE_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save schedule file:', err);
  }
}

export async function GET() {
  const schedule = readSchedule();
  return NextResponse.json({ success: true, schedule });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const current = readSchedule();
    const updated: ScheduleConfig = {
      ...current,
      enabled: typeof body.enabled === 'boolean' ? body.enabled : current.enabled,
      dispatchTime: body.dispatchTime || current.dispatchTime,
      language: body.language || current.language,
      targetScope: body.targetScope || current.targetScope,
      lastDispatchedAt: body.lastDispatchedAt !== undefined ? body.lastDispatchedAt : current.lastDispatchedAt,
    };

    writeSchedule(updated);
    return NextResponse.json({ success: true, schedule: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
