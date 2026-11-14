import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface FarmRecord {
  id: string;
  farmer_name: string;
  email: string;
  phone_number?: string;
  latitude: number;
  longitude: number;
  region: string;
  crop_type?: string;
  created_at: string;
}

export interface AlertRecord {
  id: string;
  farm_id?: string;
  farmer_name?: string;
  recipient_email?: string;
  recipient_phone?: string;
  nasa_data_snapshot: any;
  ai_generated_advice: string;
  email_status: 'pending' | 'delivered' | 'simulated' | 'failed';
  sms_status?: string;
  created_at: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseUrl.startsWith('https://') && supabaseAnonKey
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Initial pre-seeded mock farms in Dadu District, Sindh with verified email registries
const DEFAULT_FARMS: FarmRecord[] = [
  {
    id: 'f1-dadu-001',
    farmer_name: 'Ghulam Rasool Brohi',
    email: 'ghulam.rasool.brohi@sindhfarms.pk',
    latitude: 26.7341,
    longitude: 67.7795,
    region: 'Dadu City Rice Belt',
    crop_type: 'Rice (Basmati)',
    created_at: new Date().toISOString(),
  },
  {
    id: 'f2-johi-002',
    farmer_name: 'Allah Dino Chandio',
    email: 'allah.dino.chandio@daduagriculture.org',
    latitude: 26.6917,
    longitude: 67.6167,
    region: 'Johi Irrigation Corridor',
    crop_type: 'Rice (IRRI-6)',
    created_at: new Date().toISOString(),
  },
  {
    id: 'f3-mehar-003',
    farmer_name: 'Muhammad Bakhtiar Solangi',
    email: 'solangi.farms.mehar@gmail.com',
    latitude: 27.1806,
    longitude: 67.8222,
    region: 'Mehar Agricultural Hub',
    crop_type: 'Wheat',
    created_at: new Date().toISOString(),
  },
  {
    id: 'f4-sehwan-004',
    farmer_name: 'Liaquat Ali Panhwar',
    email: 'liaquat.panhwar@sehwanagri.com',
    latitude: 26.4256,
    longitude: 67.8631,
    region: 'Sehwan Indus Basin',
    crop_type: 'Cotton / Rice',
    created_at: new Date().toISOString(),
  },
  {
    id: 'f5-knshah-005',
    farmer_name: 'Gulzar Ahmad Magsi',
    email: 'gulzar.magsi@knshahfarms.pk',
    latitude: 27.0911,
    longitude: 67.7333,
    region: 'Khairpur Nathan Shah',
    crop_type: 'Wheat',
    created_at: new Date().toISOString(),
  },
];

// In-memory fallback stores for when Supabase is running locally without keys
let memoryFarms: FarmRecord[] = [...DEFAULT_FARMS];
let memoryAlerts: AlertRecord[] = [];

// Safe file-backed persistence for local / non-Supabase mode
function getPersistentFarms(): FarmRecord[] {
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'lib', 'farms-storage.json');
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (Array.isArray(data) && data.length > 0) return data;
      } else {
        fs.writeFileSync(filePath, JSON.stringify(DEFAULT_FARMS, null, 2), 'utf-8');
      }
    } catch (e) {
      // fallback to memoryFarms
    }
  }
  return memoryFarms;
}

function savePersistentFarm(newFarm: FarmRecord) {
  memoryFarms.unshift(newFarm);
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'lib', 'farms-storage.json');
      let current: FarmRecord[] = [];
      if (fs.existsSync(filePath)) {
        current = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } else {
        current = [...DEFAULT_FARMS];
      }
      // Avoid duplicate by id
      if (!current.some((f) => f.id === newFarm.id)) {
        current.unshift(newFarm);
      }
      fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not persist farm to disk:', e);
    }
  }
}

export async function fetchFarms(): Promise<FarmRecord[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          farmer_name: d.farmer_name,
          email: d.email || d.phone_number || 'farmer@dadu.pk',
          latitude: d.latitude,
          longitude: d.longitude,
          region: d.region,
          crop_type: d.crop_type,
          created_at: d.created_at,
        })) as FarmRecord[];
      }
    } catch (e) {
      console.warn('Error fetching farms from Supabase, using local fallback:', e);
    }
  }
  return getPersistentFarms();
}

export async function createFarm(farm: Omit<FarmRecord, 'id' | 'created_at'>): Promise<FarmRecord> {
  const newFarm: FarmRecord = {
    ...farm,
    id: 'farm-' + Math.random().toString(36).substring(2, 9),
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('farms').insert([farm]).select().single();
      if (!error && data) return data as FarmRecord;
    } catch (e) {
      console.warn('Error saving farm to Supabase:', e);
    }
  }

  savePersistentFarm(newFarm);
  return newFarm;
}

export async function logAiAlert(alert: {
  farm_id?: string;
  farmer_name?: string;
  recipient_email?: string;
  recipient_phone?: string;
  nasa_data_snapshot: any;
  ai_generated_advice: string;
  email_status: AlertRecord['email_status'];
}): Promise<AlertRecord> {
  const record: AlertRecord = {
    id: 'alert-' + Math.random().toString(36).substring(2, 9),
    ...alert,
    recipient_email: alert.recipient_email || alert.recipient_phone || 'farmer@dadu.pk',
    email_status: alert.email_status,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ai_alerts')
        .insert([{
          farm_id: alert.farm_id || null,
          nasa_data_snapshot: alert.nasa_data_snapshot,
          ai_generated_advice: alert.ai_generated_advice,
          email_status: alert.email_status,
          recipient_email: alert.recipient_email,
        }])
        .select()
        .single();
      if (!error && data) return { ...record, id: data.id };
    } catch (e) {
      console.warn('Error logging alert to Supabase:', e);
    }
  }

  memoryAlerts.unshift(record);
  return record;
}

export async function fetchAlerts(): Promise<AlertRecord[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ai_alerts')
        .select('*, farms(farmer_name, email, phone_number)')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          farm_id: d.farm_id,
          farmer_name: d.farms?.farmer_name || d.farmer_name || 'Dadu Farmer',
          recipient_email: d.farms?.email || d.recipient_email || d.farms?.phone_number || d.recipient_phone || 'alerts@terrasync.org',
          nasa_data_snapshot: d.nasa_data_snapshot,
          ai_generated_advice: d.ai_generated_advice,
          email_status: d.email_status || d.sms_status || 'delivered',
          created_at: d.created_at,
        }));
      }
    } catch (e) {
      console.warn('Error reading alerts from Supabase:', e);
    }
  }
  return memoryAlerts;
}
