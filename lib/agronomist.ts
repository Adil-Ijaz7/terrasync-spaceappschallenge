/**
 * TerraSync - Master AI Agronomist Engine
 * 
 * Translates NASA POWER & EONET telemetry into actionable, life-saving advice
 * formatted in Native Sindhi (سنڌي), Native Urdu (اردو), and English
 * for automated farmer email advisories and audio voice synthesis.
 */

export interface AgronomistInput {
  temperatureC: number;
  soilMoisturePercent: number;
  relativeHumidityPercent?: number;
  precipitationMm?: number;
  crop?: 'rice' | 'wheat' | 'cotton' | 'general';
  farmerName?: string;
  nearbyThreat?: string;
}

export interface AgronomistOutput {
  smsText: string;             // Roman Urdu
  sindhiText: string;          // Native Sindhi (سنڌي)
  urduText: string;            // Native Urdu (اردو)
  englishExplanation: string;  // English Explanation
  characterCount: number;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isCriticalSituation: boolean; // Flag to trigger automatic dispatch
  engineUsed: 'gemini' | 'openrouter' | 'local-expert-rules';
}

export const MASTER_AGRONOMIST_SYSTEM_PROMPT = `
You are an expert AI Agronomist operating in the TerraSync command center.
Your goal is to translate raw NASA satellite telemetry into actionable, life-saving agricultural advice for rural farmers in Sindh, Pakistan.

You will be provided with live JSON data from the NASA POWER API (containing soil moisture and temperature) and the NASA EONET API (containing active weather threats).

RULES:
1. Analyze the data strictly for agricultural impact (specifically rice and wheat crops).
2. Synthesize clear solutions for automated farmer email advisories.
3. Do not just explain the data; provide the tangible ACTION.
4. Output the final message in Roman Urdu, Native Sindhi, and Native Urdu.
5. Format: [ALERT] followed by [ACTION].
`.trim();

/**
 * Built-in Rule-Based Agronomy Expert System
 * 100% Free, runs locally, zero keys required, highly accurate for Sindh agroclimatic zones.
 */
export function generateLocalAgronomistAdvice(input: AgronomistInput): AgronomistOutput {
  const { 
    temperatureC, 
    soilMoisturePercent, 
    relativeHumidityPercent = 35, 
    precipitationMm = 0, 
    crop = 'rice', 
    nearbyThreat 
  } = input;
  const temp = Math.round(temperatureC);
  const moisture = Math.round(soilMoisturePercent);
  const humidity = Math.round(relativeHumidityPercent);
  const rain = Math.round(precipitationMm * 10) / 10;

  let romanUrdu = '';
  let sindhi = '';
  let urdu = '';
  let englishExp = '';
  let urgency: AgronomistOutput['urgencyLevel'] = 'MEDIUM';
  let isCritical = false;

  if (nearbyThreat && nearbyThreat !== 'None') {
    urgency = 'CRITICAL';
    isCritical = true;
    romanUrdu = `[ALERT] Nazdeek mosmi khatra (${nearbyThreat}) aur barish ka imkan. [ACTION] Khet k bano ko mazboot karein aur pani nikalne k raste foran khol dein.`;
    sindhi = `[خبردار] ويجهو طوفاني خطرو (${nearbyThreat}) ۽ تيز برسات جو امڪان. [عمل] ٻنن کي مضبوط ڪريو ۽ ٻني مان پاڻي نيڪال جا رستا ترت کوليو.`;
    urdu = `[الرٹ] قریبی موسمی خطرہ (${nearbyThreat}) اور بارش کا امکان ہے۔ [اقدام] کھیت کے بنوں کو مضبوط کریں اور نکاسی آب کے راستے فوری کھولیں۔`;
    englishExp = `NASA EONET detected ${nearbyThreat}. Reinforce field embankments and clear drainage channels immediately to prevent flash inundation.`;
  } else if (rain >= 5.0) {
    urgency = 'MEDIUM';
    isCritical = false;
    romanUrdu = `[ALERT] NASA satellite ne barish (${rain}mm) record ki hai. [ACTION] Aabpashi moakhar karein aur pani jama hone se rokain.`;
    sindhi = `[خبردار] ناسا سيٽلائيٽ وسيلي برسات (${rain}mm) رڪارڊ ٿي آهي. [عمل] هٿراڌو پاڻي ڏيڻ بند ڪريو ۽ ٻني مان واڌو پاڻي نيڪال رکو.`;
    urdu = `[موسمی اطلاع] ناسا سیٹلائٹ نے بارش (${rain}mm) ریکارڈ کی ہے۔ [اقدام] اضافی آبپاشی روک دیں تاکہ زمین میں پانی کھڑا نہ ہو۔`;
    englishExp = `NASA satellite rain assimilation recorded ${rain}mm precipitation. Suspend scheduled canal pumping to prevent root hypoxia.`;
  } else if (temp >= 38 && moisture <= 18) {
    urgency = 'CRITICAL';
    isCritical = true;
    const humidityNoteSindhi = humidity <= 25 ? ' سڪل لُڪ ۽ ' : ' ';
    const humidityNoteUrdu = humidity <= 25 ? ' خشک لو اور ' : ' ';
    if (crop === 'rice') {
      romanUrdu = `[ALERT] Zameen ki nami bohat kam (${moisture}%) aur shadeed garmi (${temp}°C, Nami: ${humidity}%) hai. [ACTION] Dhaan ko sokhay se bachanay k liye sham ko flood irrigation karein.`;
      sindhi = `[خبردار] ٻنيءَ ۾ پاڻي جي کوٽ (${moisture}%)،${humidityNoteSindhi}سخت گرمي (${temp}°C) آهي. [عمل] سارين کي سُڪڻ کان بچائڻ لاءِ شام جو پاڻي ضرور لڳايو.`;
      urdu = `[الرٹ] زمین میں نمی بہت کم (${moisture}%)،${humidityNoteUrdu}شدید گرمی (${temp}°C) ہے۔ [اقدام] دھان کو جلنے سے بچانے کیلئے شام کو فوری پانی لگائیں۔`;
    } else {
      romanUrdu = `[ALERT] Zameen ki nami bohat kam (${moisture}%) aur shadeed garmi (${temp}°C) hai. [ACTION] Fasal ko jalne se bachanay k liye agle 12 ghante mein aabpashi karein.`;
      sindhi = `[خبردار] زمين ۾ سخت گرمي (${temp}°C) ۽ نمي تمام گهٽ (${moisture}%) آهي. [عمل] فصل کي سڙڻ کان بچائڻ لاءِ ترت هلڪو پاڻي ڏيو.`;
      urdu = `[الرٹ] شدید گرمی (${temp}°C) اور زمین میں نمی کی شدید کمی (${moisture}%) ہے۔ [اقدام] فصل کو سوکھنے سے بچانے کیلئے اگلے 12 گھنٹے میں پانی دیں۔`;
    }
    englishExp = `Extreme heat (${temp}°C) with low humidity (${humidity}%) and critical moisture depletion (${moisture}%) threatens wilting necrosis. Schedule twilight irrigation immediately.`;
  } else if (temp >= 36 && moisture <= 25) {
    urgency = 'HIGH';
    isCritical = true;
    romanUrdu = `[ALERT] Garmi (${temp}°C) aur nami ki kami (${moisture}%). [ACTION] Agle 24 ghanton mein aabpashi karein aur dhoop k doran khad na daalein.`;
    sindhi = `[خبردار] گرمي وڌيڪ (${temp}°C) ۽ پاڻي گهٽ (${moisture}%). [عمل] ايندڙ 24 ڪلاڪن اندر ٻنيءَ کي پاڻي ڏيو ۽ تيز اُس ۾ ڀاڻ نه وجهو.`;
    urdu = `[الرٹ] گرمی (${temp}°C) اور نمی کی کمی (${moisture}%). [اقدام] اگلے 24 گھنٹوں میں آبپاشی کریں اور دوپہر میں کھاد نہ ڈالیں۔`;
    englishExp = `Elevated thermal stress with low moisture. Irrigate within 24 hours. Avoid fertilizer application during peak afternoon heat to avoid nitrogen burn.`;
  } else if (moisture >= 75) {
    urgency = 'HIGH';
    isCritical = true;
    romanUrdu = `[ALERT] Zameen mein nami bohat zyada (${moisture}%) hai. [ACTION] Fasal ki jaron ko galne se bachanay k liye izafi pani foran nikalain.`;
    sindhi = `[خبردار] ٻنيءَ ۾ تمام گهڻو پاڻي (${moisture}%) بيٺل آهي. [عمل] ٻوٽن جي پاڙن کي ڳرڻ کان بچائڻ لاءِ واڌو پاڻي ٻاهر ڪڍو.`;
    urdu = `[الرٹ] زمین میں پانی کی زیادتی (${moisture}%) ہے۔ [اقدام] فصل کی جڑوں کو گلنے سے بچانے کیلئے اضافی پانی فوری نکالیں۔`;
    englishExp = `Soil is over-saturated (${moisture}%). Risk of root rot and hypoxia. Halt irrigation and drain standing water.`;
  } else if (temp <= 12) {
    urgency = 'MEDIUM';
    isCritical = false;
    romanUrdu = `[ALERT] Sardi ki lehar (${temp}°C) aur koray ka khatra. [ACTION] Gandum ko bachane k liye sham ko halka pani laga kar zameen ko garam rakhain.`;
    sindhi = `[خبردار] سردي جي لهر (${temp}°C) ۽ ڪڪرن جو اثر. [عمل] ڪڻڪ کي بچائڻ لاءِ شام جي وقت هلڪو پاڻي لڳايو.`;
    urdu = `[الرٹ] سردی کی لہر (${temp}°C) اور کہرے کا خطرہ۔ [اقدام] گندم کو بچانے کیلئے شام کو ہلکا پانی لگا کر زمین گرم رکھیں۔`;
    englishExp = `Low temperature drop (${temp}°C). Apply light evening watering to buffer root soil temperature against frost.`;
  } else {
    urgency = 'LOW';
    isCritical = false;
    const cropLower = (crop || 'rice').toLowerCase();

    if (cropLower.includes('wheat') || cropLower === 'wheat') {
      romanUrdu = `[Gandum] Mausam mozoon hai: Darja-e-hararat ${temp}°C aur zameen ki nami ${moisture}%. [ACTION] Gandum k liye nami munasib hai, mamool ki aabpashi aur ghaas ki safai jari rakhain.`;
      sindhi = `[ڪڻڪ جو فصل] گرمي پد ${temp}°C ۽ زمين جي نمي ${moisture}%. [عمل] ڪڻڪ جي واڌ ويجهه لاءِ نمي موزون آهي، معمول مطابق پاڻي ۽ گند گاهه جي صفائي جاري رکو.`;
      urdu = `[گندم کا کھیت] درجہ حرارت ${temp}°C اور نمی ${moisture}% ہے۔ [اقدام] گندم کیلئے موجودہ نمی مناسب ہے، معمول کے مطابق آبپاشی اور جڑی بوٹیوں کی تلفی رکھیں۔`;
      englishExp = `Wheat Crop Status: Temperature ${temp}°C and profile moisture ${moisture}%. Favorable tillering conditions; maintain regular field maintenance and scheduled watering.`;
    } else if (cropLower.includes('cotton') || cropLower === 'cotton') {
      romanUrdu = `[Kapas] Mausam mozoon hai: Temp ${temp}°C aur nami ${moisture}%. [ACTION] Kapas k keeray (whitefly) ki nigrani karein aur aabpashi waqt par dein.`;
      sindhi = `[ڪپهه جو فصل] گرمي پد ${temp}°C ۽ نمي ${moisture}%. [عمل] فصل لاءِ نمي بهترين آهي. اڇي مکي ۽ سنڊي جي باقاعده چڪاس جاري رکو.`;
      urdu = `[کپاس کا کھیت] درجہ حرارت ${temp}°C اور نمی ${moisture}% ہے۔ [اقدام] نمی موزوں ہے۔ سفید مکھی اور گلابی سنڈی کا معائنہ رکھیں اور معمول کے مطابق پانی دیں۔`;
      englishExp = `Cotton Crop Status: Baseline ${temp}°C with ${moisture}% profile moisture. Continue vegetative stage scouting for whitefly and bollworm.`;
    } else if (cropLower.includes('sugarcane')) {
      romanUrdu = `[Kamad] Mausam mozoon hai: Temp ${temp}°C aur nami ${moisture}%. [ACTION] Kamad k liye mamool k mutabiq aabpashi aur khad ka tawazun barqarar rakhain.`;
      sindhi = `[ڪمند جو فصل] گرمي پد ${temp}°C ۽ نمي ${moisture}%. [عمل] ڪمند لاءِ پاڻي جي کوٽ ناهي، ترقي پسند واڌ ويجهه لاءِ معمول مطابق سنڀال رکو.`;
      urdu = `[کماد کا کھیت] درجہ حرارت ${temp}°C اور نمی ${moisture}% ہے۔ [اقدام] کماد کیلئے پانی اور نائٹروجن کھاد کا معمول کا توازن برقرار رکھیں۔`;
      englishExp = `Sugarcane Crop Status: Temperature ${temp}°C, root moisture ${moisture}%. Healthy growth profile; maintain furrow irrigation.`;
    } else {
      // Default: Rice (Basmati / IRRI-6)
      romanUrdu = `[Dhaan] Mausam mozoon hai: Darja-e-hararat ${temp}°C aur nami ${moisture}%. [ACTION] Dhaan mein pani ki satah barqarar rakhain aur keeray ki nigrani karein.`;
      sindhi = `[سارين جو فصل] گرمي پد ${temp}°C ۽ نمي ${moisture}%. [عمل] ٻنيءَ ۾ نمي موزون آهي، سارين جي فصل ۾ پاڻي جي بيهڪ برقرار رکو ۽ جيتن جي نگراني ڪريو.`;
      urdu = `[دھان کا کھیت] درجہ حرارت ${temp}°C اور نمی ${moisture}% ہے۔ [اقدام] دھان کیلئے نمی مناسب ہے۔ کھیت میں پانی کی سطح برقرار رکھیں اور کیڑوں کی جانچ کریں۔`;
      englishExp = `Rice Crop Status: Optimal microclimate (${temp}°C, ${moisture}% profile moisture). Maintain target standing water depth and continue pest scouting.`;
    }
  }

  return {
    smsText: romanUrdu.trim(),
    sindhiText: sindhi.trim(),
    urduText: urdu.trim(),
    englishExplanation: englishExp,
    characterCount: romanUrdu.length,
    urgencyLevel: urgency,
    isCriticalSituation: isCritical,
    engineUsed: 'local-expert-rules',
  };
}

/**
 * Generate AI advisory using Google Gemini API (Free tier)
 */
async function generateWithGemini(
  input: AgronomistInput,
  apiKey: string
): Promise<AgronomistOutput | null> {
  const prompt = `
NASA Telemetry:
- Temperature at 2m: ${input.temperatureC.toFixed(1)}°C
- Profile Soil Moisture: ${input.soilMoisturePercent}%
- Crop Focus: ${input.crop || 'rice'}
- Natural Threat / Event: ${input.nearbyThreat || 'None'}
- Target Area: Dadu District, Sindh, Pakistan

Respond in valid JSON with these exact fields:
{
  "romanUrdu": "[ALERT] ... [ACTION] ...",
  "sindhi": "[خبردار] ... [عمل] ...",
  "urdu": "[الرٹ] ... [اقدام] ...",
  "english": "Short solution in English",
  "isCritical": true or false
}
Keep each translation under 250 characters.
  `.trim();

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${MASTER_AGRONOMIST_SYSTEM_PROMPT}\n\n${prompt}` }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 250,
          temperature: 0.2,
          responseMimeType: 'application/json',
        }
      })
    });

    if (!res.ok) return null;

    const data = await res.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (rawJson) {
      const parsed = JSON.parse(rawJson);
      const isCritical = parsed.isCritical ?? (input.temperatureC >= 38 || input.soilMoisturePercent <= 18);
      return {
        smsText: parsed.romanUrdu || parsed.urdu || '',
        sindhiText: parsed.sindhi || '',
        urduText: parsed.urdu || '',
        englishExplanation: parsed.english || 'Gemini synthesized telemetry advisory.',
        characterCount: (parsed.romanUrdu || '').length,
        urgencyLevel: isCritical ? 'CRITICAL' : 'MEDIUM',
        isCriticalSituation: isCritical,
        engineUsed: 'gemini',
      };
    }
  } catch (err) {
    console.warn('Error querying Gemini:', err);
  }
  return null;
}

export async function generateAgronomistAdvice(input: AgronomistInput): Promise<AgronomistOutput> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey) {
    const res = await generateWithGemini(input, geminiKey);
    if (res) return res;
  }

  // Local expert heuristics fallback (100% free, highly authentic for Sindh)
  return generateLocalAgronomistAdvice(input);
}
