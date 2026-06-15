/**
 * HAJESSI — Configuration centrale
 *
 * Remplacez les valeurs ci-dessous ou définissez-les dans .env.local :
 *
 * ADMIN_PASSWORD          — Mot de passe unique pour le dashboard admin
 * GOOGLE_SHEET_WEBAPP_URL — URL de déploiement de votre Google Apps Script Web App
 * FB_PIXEL_ID             — ID Facebook Pixel (ex: 123456789012345)
 * GA_MEASUREMENT_ID       — ID Google Analytics 4 (ex: G-XXXXXXXXXX)
 */

export const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD ?? "changez-moi-en-production";

/** URL Web App Google Apps Script — à remplacer par l'utilisateur */
export const GOOGLE_SHEET_WEBAPP_URL =
  process.env.GOOGLE_SHEET_WEBAPP_URL ??
  "https://script.google.com/macros/s/VOTRE_DEPLOYMENT_ID/exec";

/** Facebook Pixel ID — placeholder à remplacer */
export const FB_PIXEL_ID =
  process.env.NEXT_PUBLIC_FB_PIXEL_ID ?? "FB_PIXEL_ID";

/** Google Analytics 4 Measurement ID — placeholder à remplacer */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "GA_MEASUREMENT_ID";

export const BRAND = {
  name: "HAJESSI",
  arabicName: "هاجسي",
  taglineFr: "L'art de la fragrance orientale",
  taglineAr: "فن العطر الشرقي",
} as const;
