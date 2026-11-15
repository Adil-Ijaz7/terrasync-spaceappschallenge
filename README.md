# TerraSync: Earth's True Detective 🛰️🔍🌾

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![NASA Open Science](https://img.shields.io/badge/NASA-Open_Science_Data-E03C31?style=for-the-badge&logo=nasa)](https://power.larc.nasa.gov/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **NASA Space Apps Challenge 2026**  
> **Challenge Track:** Be an Earth's True Detective  
> **Target Region:** District Dadu, Sindh, Pakistan (26.7341°N, 67.7795°E) with Worldwide Planetary Telemetry  
> **Core Innovation:** Orbital Forensic Telemetry + Machine Learning Multi-Day Predictive Forecasting + Autonomous Farmer Email Alerts in Native Sindhi (سنڌي), Urdu (اردو), and English.  

📖 **Full Technical Architecture Report:** See [`PROJECT_DOCUMENTATION.md`](./PROJECT_DOCUMENTATION.md)  
🌾 **سنڌي ٻوليءَ ۾ مڪمل گائيڊ (Sindhi Native Guide for Farmers & Non-Tech):** ڏسو [`SINDHI_EXPLANATION.md`](./SINDHI_EXPLANATION.md)

---

## 1. Executive Summary & Challenge Alignment

### The Ground Mystery: The "Ghost Wilting" of Agricultural Basins
In vulnerable agricultural regions like Dadu, Sindh, farmers frequently suffer sudden, catastrophic crop necrosis. Traditional weather forecasts only report ambient air temperatures, leaving farmers blind to subterranean root desiccation and soil wetness depletion occurring days before leaves physically wilt.

### The Solution: NASA Orbital Forensics + Machine Learning
TerraSync transforms NASA satellite infrastructure (**NASA POWER Agroclimatology & NASA EONET v3**) into an orbital detective:
1. **Detects Subterranean Decoupling:** Identifies when root profile moisture (`GWETPROF`) drops below the Permanent Wilting Point ($PWP$) while surface air temperatures appear deceivingly normal.
2. **Machine Learning Predictive Forensics:** Employs Ordinary Least Squares (OLS) time-series regression across past 7-day readings to project the next 3 to 7 days, estimating the daily drying velocity ($\frac{dM}{dt}$) and calculating an exact **Countdown to Lethal Wilting ($t_{\text{PWP}}$)**.
3. **Autonomous Vernacular Email Alerts:** Dispatches beautifully formatted, light-mode HTML advisory emails directly to registered smallholders in their native languages: **Sindhi (سنڌي)**, **Urdu (اردو)**, and **English**, complete with audio voice synthesis.

---

## 2. Core Features & Capabilities

- 🛰️ **Multi-Layer Planetary Map:** Toggle seamlessly between **CARTO Voyager**, **Google Hybrid**, and **Satellite Aerial** views with global zoom and clickable planetary coordinates.
- 🌊 **NASA EONET Planetary Hazard Radar:** Live worldwide tracking of active Floods, Severe Storms, Wildfires, and Volcanoes with animated color-coded markers and intelligent $\le 150\text{ km}$ local agricultural bounding.
- 🧠 **ML Predictive Time-Series Panel:** Instantaneous calculation of daily loss rates ($\%/d$), statistical confidence ($R^2$), and 3-day projected temperatures and moisture levels.
- 🌾 **Agricultural Farm Registry:** Map-based coordinate pin dropper enabling farmers to register their outposts with verified email addresses.
- 📧 **Automated Daily Email Dispatch Gateway:** Scheduled autonomous broadcast system that pulls live NASA telemetry and delivers customized emails to registered outposts every morning at a scheduled time (e.g. 06:00 AM PKT).
- 📱 **Field Agent Mobile PWA:** Responsive, touch-optimized mobile console with device GPS integration for on-field agronomists.
- 🔊 **Multilingual Voice Playback:** Web Speech API integration providing spoken audio advisories in Sindhi and Urdu.

---

## 3. Technology Stack

- **Framework:** Next.js 16 (Turbopack engine, App Router, React 19)
- **Styling & UI:** Tailwind CSS 4, Lucide React icons, Custom Light Bento Cards
- **Geographic Information System:** Leaflet & React-Leaflet with CARTO Basemaps & Google Maps Engine
- **Data Assimilation:** NASA POWER Agroclimatology REST API + NASA GSFC EONET v3 REST API
- **Machine Learning Engine:** Client & Server-side Ordinary Least Squares (OLS) Time-Series Regression
- **Email Delivery:** Nodemailer SMTP Gateway with HTML template architecture
- **Database & Persistence:** Supabase PostgreSQL Cloud Schema + Resilient Mock Fallback

---

## 4. Live Deployment Guide (Vercel)

TerraSync is optimized for zero-configuration, 1-click deployment on **Vercel** directly connected to this GitHub repository.

### Step 1: Import Project into Vercel
1. Log in to [Vercel](https://vercel.com/) and click **"Add New..." > "Project"**.
2. Select your GitHub repository: `Adil-Ijaz7/terrasync-spaceappschallenge`.
3. Framework Preset will automatically detect **Next.js**.

### Step 2: Configure Environment Variables
In the Vercel project configuration, add the following Environment Variables:

| Variable Name | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_CARTO_API_KEY` | CARTO Basemaps Tile API Key | `cb1_5911_1_9c76b37cd4d732d8144e0786` |
| `SMTP_HOST` | Email SMTP Server Host | `smtp.gmail.com` |
| `SMTP_PORT` | Email SMTP Port | `465` (SSL) or `587` (TLS) |
| `SMTP_USER` | Verified Email Address | `your-email@gmail.com` |
| `SMTP_PASS` | Gmail App Password (16 chars) | `xxxx xxxx xxxx xxxx` |
| `SMTP_FROM` | Sender Name & Address | `"TerraSync Orbital Sentinel" <your-email@gmail.com>` |
| `NEXT_PUBLIC_SUPABASE_URL` | *(Optional)* Supabase Cloud URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Optional)* Supabase Public Key | `your_anon_key` |

> **Note on Gmail:** To generate a Gmail App Password, enable 2-Factor Authentication on your Google Account, navigate to **Security > App passwords**, generate a key under name "TerraSync", and paste the 16-character code as `SMTP_PASS`.

### Step 3: Deploy
Click **"Deploy"**. Vercel will run `next build`, optimize all 15 static/dynamic routes, and provide your live production URL within 60 seconds!

---

## 5. Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/Adil-Ijaz7/terrasync-spaceappschallenge.git
cd terrasync-spaceappschallenge

# 2. Install dependencies
npm install

# 3. Copy environment variables template
cp .env.example .env.local
# (Fill in your CARTO API key and SMTP credentials in .env.local)

# 4. Run the development server
npm run dev

# 5. Open your browser
# Navigate to http://localhost:3000
```

---

## 6. NASA Open Science Data Citations

1. *Agroclimatology data (T2M, GWETPROF, RH2M, PRECTOTCORR) were obtained from the NASA Langley Research Center (LaRC) POWER Project funded through the NASA Earth Science/Applied Science Program.*
2. *Natural hazard tracking is powered by the Earth Observatory Natural Event Tracker (EONET v3), managed by NASA Goddard Space Flight Center (GSFC).*

---

## 7. License
This project is open-source under the **MIT License** for the NASA Space Apps Challenge 2026.
