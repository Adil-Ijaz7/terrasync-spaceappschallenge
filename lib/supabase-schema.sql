-- =========================================================
-- TerraSync - Supabase PostgreSQL Database Schema
-- NASA Space Apps Challenge - Target Region: Dadu, Sindh
-- Run this in your Supabase SQL Editor (100% Free Tier)
-- =========================================================

-- Table 1: Farm Locations
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farmer_name TEXT,
    email TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    region TEXT DEFAULT 'Dadu, Sindh',
    crop_type TEXT DEFAULT 'Rice',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table 2: AI & ML Agronomist Email Alerts
CREATE TABLE IF NOT EXISTS public.ai_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
    nasa_data_snapshot JSONB NOT NULL,
    ai_generated_advice TEXT NOT NULL,
    email_status TEXT DEFAULT 'delivered',
    recipient_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Setup Row Level Security (RLS) policies for open hackathon testing
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read/write for all users" ON public.farms;
CREATE POLICY "Enable read/write for all users" ON public.farms FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable read/write for all users" ON public.ai_alerts;
CREATE POLICY "Enable read/write for all users" ON public.ai_alerts FOR ALL USING (true);

-- Insert Sample Initial Farm Clusters in Dadu District with verified email addresses
INSERT INTO public.farms (farmer_name, email, latitude, longitude, region, crop_type)
VALUES
  ('Ghulam Rasool Brohi', 'ghulam.rasool.brohi@sindhfarms.pk', 26.7341, 67.7795, 'Dadu City Rice Belt', 'Rice (Basmati)'),
  ('Allah Dino Chandio', 'allah.dino.chandio@daduagriculture.org', 26.6917, 67.6167, 'Johi Irrigation Corridor', 'Rice (IRRI-6)'),
  ('Muhammad Bakhtiar Solangi', 'solangi.farms.mehar@gmail.com', 27.1806, 67.8222, 'Mehar Agricultural Hub', 'Wheat'),
  ('Liaquat Ali Panhwar', 'liaquat.panhwar@sehwanagri.com', 26.4256, 67.8631, 'Sehwan Indus Basin', 'Cotton / Rice'),
  ('Gulzar Ahmad Magsi', 'gulzar.magsi@knshahfarms.pk', 27.0911, 67.7333, 'KN Shah Flood Plain', 'Wheat')
ON CONFLICT DO NOTHING;
