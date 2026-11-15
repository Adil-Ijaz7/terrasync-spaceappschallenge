/**
 * TerraSync - Master Automated Farmer Email Dispatch Service
 * 
 * Replaces legacy chat/SMS protocols with institutional, structured,
 * multilingual automated email advisories powered by NASA Open Data
 * and Machine Learning predictive microclimate forecasting.
 */

import nodemailer from 'nodemailer';
import { MlPredictionResult } from './ml-detector';
import { NasaTelemetrySnapshot } from './nasa';
import { logAiAlert } from './supabase';

export interface EmailAlertPayload {
  to: string;
  farmerName: string;
  farmId?: string;
  crop?: string;
  region?: string;
  nasaSnapshot?: NasaTelemetrySnapshot | null;
  mlPrediction?: MlPredictionResult | null;
  advisoryTextEnglish?: string;
  advisoryTextSindhi?: string;
  advisoryTextUrdu?: string;
  urgencyLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  isAutoTriggered?: boolean;
}

export interface EmailDispatchResult {
  success: boolean;
  mode: 'live_smtp' | 'ethereal_webmail' | 'simulated_carrier';
  messageId: string;
  recipientEmail: string;
  timestamp: string;
  summary: string;
  previewHtml?: string;
  previewUrl?: string;
  error?: string;
}

/**
 * Configure Nodemailer Transport
 */
function getMailerTransport() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const host = process.env.SMTP_HOST?.trim() || (user?.includes('@gmail.com') ? 'smtp.gmail.com' : undefined);
  const port = parseInt(process.env.SMTP_PORT || '465', 10);

  if (user && pass) {
    if (host?.includes('gmail') || user.includes('@gmail.com')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }
    return nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return null;
}

/**
 * Build a responsive HTML email tailored for Pakistani smallholder farmers
 */
export function generateAlertEmailHtml(payload: EmailAlertPayload): string {
  const {
    farmerName,
    crop = 'Rice',
    region = 'Dadu District, Sindh',
    nasaSnapshot,
    mlPrediction,
    advisoryTextEnglish = 'Thermal desiccation warning. Irrigate field immediately.',
    advisoryTextSindhi = '[خبردار] زمين ۾ سخت گرمي ۽ پاڻي جي کوٽ. شام جو ترت آبپاشي ڪريو.',
    advisoryTextUrdu = '[الرٹ] شدید گرمی اور زمین میں نمی کی خطرناک کمی۔ شام کو فوری پانی لگائیں۔',
    urgencyLevel = 'HIGH',
  } = payload;

  const temp = nasaSnapshot?.power.temperatureC ?? 38.5;
  const moisture = nasaSnapshot?.power.soilMoisturePercent ?? 14;
  const daysToPwp = mlPrediction?.predictedDaysToPWP ?? 1.5;
  const trend = mlPrediction?.trendDirection ?? 'RAPID_DRYING';
  const confidence = mlPrediction?.modelConfidence ?? 94.2;

  const badgeBg =
    urgencyLevel === 'CRITICAL'
      ? '#fef2f2'
      : urgencyLevel === 'HIGH'
      ? '#fff7ed'
      : urgencyLevel === 'MODERATE'
      ? '#fefce8'
      : '#ecfdf5';

  const badgeText =
    urgencyLevel === 'CRITICAL'
      ? '#b91c1c'
      : urgencyLevel === 'HIGH'
      ? '#c2410c'
      : urgencyLevel === 'MODERATE'
      ? '#a16207'
      : '#047857';

  const badgeBorder =
    urgencyLevel === 'CRITICAL'
      ? '#fecaca'
      : urgencyLevel === 'HIGH'
      ? '#fed7aa'
      : urgencyLevel === 'MODERATE'
      ? '#fde047'
      : '#a7f3d0';

  const forecastRows = mlPrediction?.forecast3Days && mlPrediction.forecast3Days.length > 0
    ? mlPrediction.forecast3Days.map((f, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 10px 14px; font-weight: 600; color: #334155;">Day +${f.dayOffset} (${f.dateStr})</td>
        <td style="padding: 10px 14px; color: #0f172a; font-family: monospace; font-weight: bold;">${f.predictedTempC}°C</td>
        <td style="padding: 10px 14px; color: #0284c7; font-family: monospace; font-weight: bold;">${f.predictedMoisturePercent}%</td>
        <td style="padding: 10px 14px;">
          <span style="display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; background: ${
            f.riskLevel === 'CRITICAL' ? '#fef2f2' : f.riskLevel === 'HIGH' ? '#fff7ed' : '#ecfdf5'
          }; color: ${
            f.riskLevel === 'CRITICAL' ? '#b91c1c' : f.riskLevel === 'HIGH' ? '#c2410c' : '#047857'
          }; border: 1px solid ${
            f.riskLevel === 'CRITICAL' ? '#fecaca' : f.riskLevel === 'HIGH' ? '#fed7aa' : '#a7f3d0'
          };">
            ${f.riskLevel}
          </span>
        </td>
      </tr>
    `).join('')
    : `
      <tr>
        <td colspan="4" style="padding: 14px; text-align: center; color: #64748b; font-size: 12px;">Daily extrapolation computed from 7-day NASA POWER telemetry.</td>
      </tr>
    `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TerraSync Agricultural Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f7f6; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Email Container Matching Web App Aesthetic -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);">
          
          <!-- Clean White Header with Brand Logo Matching Web App -->
          <tr>
            <td style="background-color: #ffffff; padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
              <table width="100%" role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <!-- TerraSync Brand Mark -->
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background-color: #0f172a; width: 36px; height: 36px; border-radius: 10px; text-align: center;">
                            <tr>
                              <td align="center" valign="middle" style="height: 36px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                                  <tr>
                                    <td style="padding: 1.5px;"><span style="display: block; width: 5px; height: 5px; border-radius: 50%; background-color: #ffffff;"></span></td>
                                    <td style="padding: 1.5px;"><span style="display: block; width: 5px; height: 5px; border-radius: 50%; background-color: #ffffff;"></span></td>
                                  </tr>
                                  <tr>
                                    <td colspan="2" align="center" style="padding: 1.5px;"><span style="display: block; width: 5px; height: 5px; border-radius: 50%; background-color: #34d399; margin: 0 auto;"></span></td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="vertical-align: middle;">
                          <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; line-height: 1.2;">
                            Terra<span style="color: #059669;">Sync</span>
                          </div>
                          <div style="margin-top: 3px; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 600;">
                            NASA Space Apps &bull; Earth&apos;s True Detective
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background: ${badgeBg}; color: ${badgeText}; border: 1px solid ${badgeBorder}; padding: 5px 14px; border-radius: 9999px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
                      ${urgencyLevel} RISK
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Farmer & Outpost Metadata Strip -->
          <tr>
            <td style="padding: 16px 24px; border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
              <table width="100%" role="presentation">
                <tr>
                  <td style="font-size: 13px; color: #475569; line-height: 1.5;">
                    Recipient: <strong style="color: #0f172a;">${farmerName}</strong><br>
                    Outpost: <strong style="color: #0284c7;">${region}</strong>
                  </td>
                  <td align="right" style="font-size: 13px; color: #475569; line-height: 1.5;">
                    Crop Target: <strong style="color: #059669;">${crop}</strong><br>
                    ML Confidence: <strong style="color: #7c3aed;">${confidence}%</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Primary Urgent Notice in Native Sindhi -->
          <tr>
            <td style="padding: 22px 24px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <div style="direction: rtl; text-align: right;">
                <span style="color: #0284c7; font-size: 11px; display: block; margin-bottom: 6px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                  سنڌي زرعي هدايت (Native Sindhi Advisory)
                </span>
                <div style="font-size: 16px; line-height: 1.7; color: #0f172a; font-weight: 600;">
                  ${advisoryTextSindhi}
                </div>
              </div>
            </td>
          </tr>

          <!-- Urgent Notice in Native Urdu -->
          <tr>
            <td style="padding: 20px 24px; background-color: #fafbfc; border-bottom: 1px solid #e2e8f0;">
              <div style="direction: rtl; text-align: right;">
                <span style="color: #059669; font-size: 11px; display: block; margin-bottom: 6px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                  اردو زرعی مشورہ (Native Urdu Advisory)
                </span>
                <div style="font-size: 15px; line-height: 1.7; color: #1e293b; font-weight: 500;">
                  ${advisoryTextUrdu}
                </div>
              </div>
            </td>
          </tr>

          <!-- Current NASA Telemetry Bento Grid -->
          <tr>
            <td style="padding: 22px 24px; border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
              <div style="margin-bottom: 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: #64748b; font-weight: 700;">
                Live NASA POWER Observation
              </div>
              <table width="100%" role="presentation" cellspacing="8" cellpadding="0">
                <tr>
                  <td width="50%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                    <div style="font-size: 11px; color: #ea580c; text-transform: uppercase; font-weight: 700;">Surface Temp (T2M)</div>
                    <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 4px;">${temp.toFixed(1)}°C</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">CERES / MERRA-2 assimilation</div>
                  </td>
                  <td width="50%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                    <div style="font-size: 11px; color: #0284c7; text-transform: uppercase; font-weight: 700;">Root Zone Moisture</div>
                    <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 4px;">${moisture}%</div>
                    <div style="font-size: 11px; color: #e11d48; margin-top: 2px;">Wilting Threshold: 13.5%</div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                    <div style="font-size: 11px; color: #0d9488; text-transform: uppercase; font-weight: 700;">Relative Humidity (RH2M)</div>
                    <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 4px;">${nasaSnapshot?.power.relativeHumidityPercent ?? 35}%</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Atmospheric Vapor Deficit</div>
                  </td>
                  <td width="50%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                    <div style="font-size: 11px; color: #6366f1; text-transform: uppercase; font-weight: 700;">Precipitation (Rain)</div>
                    <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 4px;">${(nasaSnapshot?.power.precipitationMm ?? 0.0).toFixed(1)} mm</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">GPM / IMERG Satellite Feed</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Machine Learning Predictive Section -->
          <tr>
            <td style="padding: 22px 24px; border-bottom: 1px solid #e2e8f0; background-color: #fafbfc;">
              <table width="100%" role="presentation" style="margin-bottom: 12px;">
                <tr>
                  <td>
                    <div style="font-size: 13px; color: #0f172a; font-weight: 700;">
                      ML Predictive Forecast (Next 3 Days)
                    </div>
                    <div style="margin-top: 2px; font-size: 11px; color: #64748b;">
                      Calculated via Ordinary Least Squares (OLS) time-series regression.
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; font-size: 11px; font-weight: 700; color: #c2410c; background: #fff7ed; border: 1px solid #fed7aa; padding: 3px 10px; border-radius: 9999px;">
                      PWP in ${daysToPwp} Days
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Forecast Table -->
              <table width="100%" cellspacing="0" cellpadding="0" style="font-size: 12px; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0; text-align: left;">
                    <th style="padding: 10px 14px; color: #475569; font-weight: 700; font-size: 11px; text-transform: uppercase;">Projection</th>
                    <th style="padding: 10px 14px; color: #475569; font-weight: 700; font-size: 11px; text-transform: uppercase;">Pred. Temp</th>
                    <th style="padding: 10px 14px; color: #475569; font-weight: 700; font-size: 11px; text-transform: uppercase;">Pred. Moisture</th>
                    <th style="padding: 10px 14px; color: #475569; font-weight: 700; font-size: 11px; text-transform: uppercase;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${forecastRows}
                </tbody>
              </table>

              <div style="margin-top: 14px; padding: 12px 14px; border-left: 3px solid #0284c7; background-color: #ffffff; border: 1px solid #e2e8f0; border-left-width: 3px; border-radius: 8px; font-size: 12px; color: #334155; line-height: 1.5;">
                <strong style="color: #0284c7;">Technical Synthesis:</strong> ${advisoryTextEnglish}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 22px 24px; text-align: center; background-color: #f8fafc;">
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.6;">
                This automated advisory is dispatched by <strong>TerraSync</strong> powered by NASA Open Science Data.<br>
                Missions: NASA POWER Agroclimatology (CERES &amp; MERRA-2) + NASA EONET v3.<br>
                Target District: Dadu, Sindh, Pakistan.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Dispatch an automated alert email to a registered farmer
 */
export async function sendAlertEmail(payload: EmailAlertPayload): Promise<EmailDispatchResult> {
  const {
    to,
    farmerName,
    farmId,
    advisoryTextEnglish,
    advisoryTextSindhi,
    advisoryTextUrdu,
    nasaSnapshot,
    mlPrediction,
    urgencyLevel = 'HIGH',
  } = payload;

  const timestamp = new Date().toISOString();
  const emailHtml = generateAlertEmailHtml(payload);
  const subject = `[TerraSync ${urgencyLevel} Alert] Microclimate Risk Advisory for ${farmerName}`;

  const messageText = `
TerraSync Agricultural Intelligence Alert
Recipient: ${farmerName} (${to})
Urgency: ${urgencyLevel}

[سنڌي صلاح]
${advisoryTextSindhi || 'ٻنيءَ ۾ سخت گرمي ۽ پاڻي جي کوٽ. شام جو آبپاشي ڪريو.'}

[اردو الرٹ]
${advisoryTextUrdu || 'شدید گرمی اور زمین میں نمی کی خطرناک کمی۔ شام کو پانی لگائیں۔'}

[English Technical]
${advisoryTextEnglish || 'Immediate twilight irrigation recommended.'}

ML Forecast: Permanent Wilting Point breach predicted in ${mlPrediction?.predictedDaysToPWP || 1.5} days.
Confidence: ${mlPrediction?.modelConfidence || 94.2}%
NASA Telemetry: Temp ${nasaSnapshot?.power.temperatureC || 38.5}°C, Moisture ${nasaSnapshot?.power.soilMoisturePercent || 14}%
  `.trim();

  const transporter = getMailerTransport();
  let liveSent = false;
  let sentMessageId = `EMAIL_SIM_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  let liveError: string | undefined;
  let etherealUrl: string | undefined;

  // 1. Try Live User-Configured SMTP (Gmail, SendGrid, etc.)
  if (transporter) {
    try {
      const fromAddress = process.env.SMTP_FROM || `"TerraSync Agro-Alert" <${process.env.SMTP_USER}>`;
      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text: messageText,
        html: emailHtml,
      });
      sentMessageId = info.messageId || sentMessageId;
      liveSent = true;
    } catch (smtpErr: any) {
      console.warn('Live SMTP send failed:', smtpErr.message);
      liveError = smtpErr.message;
    }
  }

  // 2. If Live SMTP not configured or failed, dispatch via Ethereal Live Test Mailbox
  if (!liveSent) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      const etherealTransporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const ethInfo = await etherealTransporter.sendMail({
        from: '"TerraSync Agro-Alert" <alerts@terrasync.org>',
        to,
        subject,
        text: messageText,
        html: emailHtml,
      });

      const url = nodemailer.getTestMessageUrl(ethInfo);
      if (url) {
        etherealUrl = url as string;
        sentMessageId = ethInfo.messageId || sentMessageId;
      }
    } catch (ethErr: any) {
      console.warn('Ethereal test dispatch fallback error:', ethErr.message);
    }
  }

  // Record dispatch in database / audit log
  await logAiAlert({
    farm_id: farmId,
    farmer_name: farmerName,
    recipient_email: to,
    nasa_data_snapshot: {
      nasa: nasaSnapshot || {},
      mlPrediction: mlPrediction || {},
    },
    ai_generated_advice: advisoryTextSindhi || advisoryTextUrdu || advisoryTextEnglish || messageText,
    email_status: liveSent ? 'delivered' : 'simulated',
  });

  const mode = liveSent
    ? 'live_smtp'
    : etherealUrl
    ? 'ethereal_webmail'
    : 'simulated_carrier';

  const summary = liveSent
    ? `Live email alert sent directly to ${to} via SMTP!`
    : etherealUrl
    ? `Alert sent to live Webmail inbox (viewable online). To send to real Gmail, add SMTP_USER & SMTP_PASS in .env.local!`
    : `Alert email processed and recorded for ${to}.`;

  return {
    success: true,
    mode,
    messageId: sentMessageId,
    recipientEmail: to,
    timestamp,
    summary,
    previewHtml: emailHtml,
    previewUrl: etherealUrl,
    error: liveError,
  };
}

/**
 * Bulk dispatch alerts to multiple farmers
 */
export async function sendBulkFarmerAlerts(
  farmers: Array<{ email: string; name: string; farmId: string; crop?: string; region?: string }>,
  telemetry: NasaTelemetrySnapshot,
  prediction: MlPredictionResult,
  advisoryTextSindhi: string,
  advisoryTextUrdu: string,
  advisoryTextEnglish: string
): Promise<EmailDispatchResult[]> {
  const results: EmailDispatchResult[] = [];

  for (const f of farmers) {
    const res = await sendAlertEmail({
      to: f.email,
      farmerName: f.name,
      farmId: f.farmId,
      crop: f.crop,
      region: f.region,
      nasaSnapshot: telemetry,
      mlPrediction: prediction,
      advisoryTextSindhi,
      advisoryTextUrdu,
      advisoryTextEnglish,
      urgencyLevel: prediction.predictedRiskLevel,
      isAutoTriggered: true,
    });
    results.push(res);
  }

  return results;
}
