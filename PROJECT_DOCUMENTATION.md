# TerraSync — Earth's True Detective: Comprehensive Platform Documentation

> **NASA Space Apps Challenge 2026**  
> **Challenge Track:** Earth's True Detective  
> **Official Repository:** [github.com/Adil-Ijaz7/terrasync-spaceappschallenge](https://github.com/Adil-Ijaz7/terrasync-spaceappschallenge)  
> **Primary Study & Deployment Basin:** District Dadu, Sindh, Pakistan (26.7341°N, 67.7795°E) with Worldwide Planetary Telemetry Support  

---

# PART 1: Non-Technical Overview (For Judges, Farmers & General Audiences)

## 1. What is TerraSync?
**TerraSync** is an autonomous agricultural resilience platform that acts as **"Earth's True Detective"**. It combines open satellite observations from **NASA Earth Science** with **Machine Learning microclimate forecasting** to protect smallholder farmers from crop loss, extreme heat, and sudden weather disasters.

Instead of requiring expensive ground sensors or hardware that poor farmers cannot afford, TerraSync scans agricultural lands from space, predicts crop stress days before it becomes visible to the human eye, and automatically delivers clear, life-saving instructions in **Native Sindhi (سنڌي)**, **Native Urdu (اردو)**, and **English** directly to farmers via email and spoken voice.

---

## 2. The Real-World Problem: The Silent Crop Crisis
In vulnerable agricultural regions like **District Dadu, Sindh, Pakistan**, smallholder farming families face devastating climate pressures:

1. **The "Ghost Wilting" Mystery:**
   Traditional weather apps only tell farmers the ambient air temperature. A farmer might see a moderate forecast of 32°C and assume their crops are safe. However, scorching solar radiation and dry desert winds quietly suck moisture from the soil. By the time rice leaves turn yellow or wheat stalks snap, root necrosis has already occurred and the harvest is destroyed.
2. **Extreme Climate Whiplash:**
   Dadu District experienced historical inundation during the 2022 super-floods, followed immediately by record-breaking 48°C+ summer heatwaves. Farmers have no early-warning radar to anticipate when dry soils are reaching lethal wilting limits.
3. **The Language and Digital Divide:**
   Most modern agricultural software is written in English and filled with complex scientific jargon. Rural Pakistani smallholders need actionable, straightforward advice in their native language—telling them *exactly when to irrigate, what time of day to pump water, and how to protect their specific crop variety*.

---

## 3. How TerraSync Solves the Mystery (The "Detective" in Action)
TerraSync operates as an orbital forensic detective through three simple steps:

```
[ NASA Satellites ] ──> [ Machine Learning Brain ] ──> [ Direct Farmer Communication ]
  Scans soil depth        Calculates drying rate          Sends plain Sindhi & Urdu
  & surface heat          & days to crop wilting          guidance via Email & Voice
```

1. **Orbital Evidence Gathering:**
   Every day, NASA satellites pass over agricultural sectors, measuring subterranean root-zone soil wetness (`GWETPROF`), surface temperatures (`T2M`), air humidity (`RH2M`), and rainfall.
2. **Forecasting the Invisible Danger:**
   TerraSync’s Machine Learning engine analyzes past 7-day trends. It determines whether soil moisture is dropping faster than usual and calculates the **Permanent Wilting Point (PWP)**—giving farmers a precise countdown (e.g., *"Root moisture will reach lethal wilting in 3.2 days"*).
3. **Direct Actionable Action (No Jargon):**
   The platform alerts the farmer with concrete instructions:
   - *Example in Sindhi:* `[سارين جو فصل] گرمي پد 27°C ۽ نمي 29%. ٻنيءَ ۾ نمي موزون آهي، سارين جي فصل ۾ پاڻي جي بيهڪ برقرار رکو.`
   - *Example in Urdu:* `[دھان کا کھیت] درجہ حرارت 27°C اور نمی 29% ہے۔ کھیت میں پانی کی سطح برقرار رکھیں اور کیڑوں کی جانچ کریں۔`
   - *Actionable Advice:* Telling the farmer to irrigate at twilight (evening) rather than afternoon to prevent evaporative water loss.

---

## 4. Key Real-World Benefits
- **Zero Hardware Costs:** No ground sensors to install, maintain, or repair; 100% powered by NASA Open Science satellite infrastructure.
- **Water Conservation:** Farmers stop flood-irrigating blindly, conserving scarce Indus River canal water for when the root zone actually demands it.
- **Protection of Livelihoods:** Eliminates sudden crop failures, giving families food security and stable agricultural income.
- **Multilingual Accessibility:** Serves rural communities in their native tongue with one-click voice speech playback.

---

# PART 2: Technical Deep Dive (For Engineers, Reviewers & Scientists)

## 1. System Architecture & Modern Tech Stack

TerraSync is engineered with Next.js 16 (App Router with Turbopack engine) and TypeScript, following clean modular design patterns:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TERRASYNC PLATFORM ARCHITECTURE                │
├────────────────────────────────────────────────────────────────────────┤
│  PRESENTATION LAYER (Next.js 16, React 19, Tailwind CSS 4, Lucide)     │
│  ├── / (Command Dashboard with Leaflet 3-Layer Map & Telemetry Bento)  │
│  ├── /farms (Agricultural Registry & Map Pin Dropper)                 │
│  ├── /alerts (Historical Dispatch Audit Trail & Web Speech Audio)      │
│  ├── /field (Field Agent Offline-Ready Mobile PWA with GPS)            │
│  └── /settings (Autonomous Daily Email Dispatch Cron Configuration)    │
├────────────────────────────────────────────────────────────────────────┤
│  INTELLIGENCE & SERVICES LAYER (TypeScript Server Runtimes)            │
│  ├── lib/nasa.ts (NASA POWER & EONET v3 Geo-Spatial Assimilation)       │
│  ├── lib/ml-detector.ts (OLS Regression & PWP Trajectory Forecaster)   │
│  ├── lib/agronomist.ts (Expert Agroclimatic Vernacular Rule Engine)    │
│  ├── lib/email-service.ts (Nodemailer Light-Themed HTML Generator)     │
│  └── lib/supabase.ts (Cloud PostgreSQL Persistence + Local Storage)    │
├────────────────────────────────────────────────────────────────────────┤
│  EXTERNAL DATA & INFRASTRUCTURE                                        │
│  ├── NASA POWER Agroclimatology (CERES Satellite & Goddard MERRA-2)    │
│  ├── NASA EONET v3 (Earth Observatory Natural Event Tracker API)       │
│  ├── CARTO CDN & Google Maps Tile Engine                               │
│  └── SMTP Email Relay (Gmail App Password, AWS SES, or SendGrid)       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. NASA Open Science Data Integration

### A. NASA POWER Agroclimatology API
- **Endpoint:** `https://power.larc.nasa.gov/api/temporal/daily/point`
- **Resolution:** Global 0.5° x 0.5° spatial latitude/longitude grid.
- **Key Assimilated Parameters:**
  - `T2M`: Earth surface skin & 2-meter air temperature (°C).
  - `GWETPROF`: Root-zone profile soil moisture wetness ($0.00\text{--}1.00$, converted to percentage).
  - `RH2M`: 2-meter relative humidity percentage (identifying atmospheric vapor pressure deficits).
  - `PRECTOTCORR`: Bias-corrected daily precipitation (mm/day from GPM/IMERG satellites).
  - `ALLSKY_SFC_SW_DWN`: All-sky surface shortwave downward irradiance ($\text{MJ/m}^2/\text{day}$).

### B. NASA EONET v3 (Earth Observatory Natural Event Tracker)
- **Endpoint:** `https://eonet.gsfc.nasa.gov/api/v3/events`
- **Planetary Tracking:** Continuously monitors active natural hazards worldwide:
  - 🌊 **Floods** (Satellite radar gauge & inundation polygons)
  - 🌀 **Severe Storms & Tropical Cyclones**
  - 🔥 **Wildfires** (MODIS & VIIRS thermal hotspots)
  - 🌋 **Volcanic Activity**
- **Smart Proximity Bounding Filter:**
  While all global hazards are rendered on the world map for planetary awareness, the **agricultural alert engine strictly restricts local farm threat triggers to events within a $\le 150\text{ km}$ geodesic radius**. This ensures distant global phenomena (e.g., floods in other continents) do not create false alarms for Pakistani farms.

---

## 3. Machine Learning Predictive Engine (`lib/ml-detector.ts`)

### Mathematical Foundation: Ordinary Least Squares (OLS) Time-Series Regression
TerraSync trains an analytical regression model over a rolling sequence of historical daily observations $\mathbf{D} = \{(t_i, M_i, T_i)\}_{i=1}^{n}$ to calculate the instantaneous moisture loss velocity:

$$\frac{dM}{dt} = \frac{\sum_{i=1}^{n} (t_i - \bar{t})(M_i - \bar{M})}{\sum_{i=1}^{n} (t_i - \bar{t})^2}$$

Where:
- $t_i$: Day offset ($0, 1, \dots, n-1$)
- $M_i$: Soil moisture percentage at day $i$
- $\bar{t}, \bar{M}$: Sample means across the observation window

### Permanent Wilting Point (PWP) Countdown Formulation
The days remaining until physiological wilting necrosis is calculated as:

$$t_{\text{PWP}} = \frac{M_{\text{current}} - PWP_{\text{threshold}}}{\left| \frac{dM}{dt} \right|}$$

- **Rice (Basmati / IRRI-6):** $PWP_{\text{threshold}} = 13.5\%$ (High water sensitivity; shallow root architecture).
- **Wheat (Rabi):** $PWP_{\text{threshold}} = 10.0\%$ (Moderate drought tolerance; deep tillering roots).
- **Cotton:** $PWP_{\text{threshold}} = 12.0\%$ (High thermal sensitivity; boll development stage).

### Goodness-of-Fit & Model Confidence Calibration
Model reliability is statistically verified using the coefficient of determination ($R^2$):

$$R^2 = 1 - \frac{SS_{\text{res}}}{SS_{\text{tot}}} = 1 - \frac{\sum_{i} (M_i - \hat{M}_i)^2}{\sum_{i} (M_i - \bar{M})^2}$$

The confidence percentage displayed on the dashboard ($82.0\%\text{--}98.5\%$) reflects this regression accuracy.

---

## 4. Crop-Specific Agronomic Rules (`lib/agronomist.ts`)
The advice engine maps microclimate values to tailored agronomic solutions:
- **Rice (Basmati / IRRI-6):** Focuses on maintaining a continuous $2\text{--}5\text{ cm}$ standing water buffer, monitoring yellow stem borer, and preventing heat-induced grain sterility above 36°C.
- **Wheat (Rabi Season):** Calibrated for crown root initiation and tillering, recommending light evening irrigation to buffer against night frost when temperatures fall below 12°C.
- **Cotton:** Recommends whitefly and pink bollworm scouting intervals and timing furrow irrigation during twilight hours to prevent excessive shedding.

---

## 5. Automated Email Dispatch & Audio Synthesis
- **Email Template:** Designed in a clean, executive **light-mode pastel aesthetic** matching the web app:
  - White container card with subtle `#e2e8f0` borders.
  - Official 3-orbital TerraSync brand logo glyph in the header.
  - Native Sindhi and Urdu translation blocks.
  - 4-tile NASA observation bento grid.
  - 3-day predictive forecast table with color-coded risk status badges.
- **Voice Playback:** Uses the browser Web Speech API (`SpeechSynthesisUtterance`) with phonetic fallback routing for Urdu, Sindhi, and Arabic voices.

---

## 6. End-to-End API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/analyze` | `POST` | Ingests `{latitude, longitude, crop}`, pulls live NASA POWER & EONET data, runs ML predictions, and returns multilingual advice. |
| `/api/farms` | `GET`, `POST` | Fetches registered farm outposts or registers a new farm with GPS coordinates and verified email. |
| `/api/email-alert` | `POST` | Renders the HTML advisory email and dispatches it via SMTP to the farmer, logging the event in the audit trail. |
| `/api/alerts` | `GET` | Returns the audit history of all dispatched automated emails with timestamps and delivery status. |
| `/api/settings/schedule` | `GET`, `POST` | Reads and updates the autonomous daily broadcast schedule (dispatch time, target scope, language). |

---

## 7. NASA Mandatory Citations
1. *Agroclimatology data (T2M, GWETPROF, RH2M, PRECTOTCORR) were obtained from the NASA Langley Research Center (LaRC) POWER Project funded through the NASA Earth Science/Applied Science Program.*
2. *Natural hazard event tracking was obtained from the Earth Observatory Natural Event Tracker (EONET v3), leveraging NASA GSFC open APIs.*
