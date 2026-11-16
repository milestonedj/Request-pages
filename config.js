// ============================================================
// MILESTONE EVENT PAGES — CONFIGURATION
// This is the ONLY file you need to edit.
// Follow README.md → "Firebase setup" and paste your config
// into FIREBASE_CONFIG below. Everything else is optional.
// ============================================================

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAebPO95xpVAoE28iIyZl2_uObizICVme4",
  authDomain: "milestone-wedding-requests.firebaseapp.com",
  databaseURL: "https://milestone-wedding-requests-default-rtdb.firebaseio.com",
  projectId: "milestone-wedding-requests",
  storageBucket: "milestone-wedding-requests.firebasestorage.app",
  messagingSenderId: "194681614176",
  appId: "1:194681614176:web:29bbc2dd583d9e771c7805",
};

// Emails the couple a confirmation with their private link when they submit or
// save the pre-consult form. Uses EmailJS (free). Leave as-is to disable email;
// see README → "Email confirmations" to turn it on (paste your 3 EmailJS values).
export const EMAILJS = {
  publicKey: "prXhld4RxZU-CybSt",
  serviceId: "service_ymm34k2",
  templateId: "template_hb6exwx",
};
export const isEmailConfigured = () => !EMAILJS.publicKey.startsWith("PASTE");

export const SETTINGS = {
  // Venmo username exactly as it appears in your profile URL
  venmoHandle: "Rhys-pullen",

  tipLine: "Tips are never expected — but always appreciated.",

  djName: "Rhys",

  // Requests made before this hour (24h) count toward the PREVIOUS night,
  // so a 12:30am request still belongs to tonight's wedding.
  nightRolloverHour: 6,

  // Gentle anti-spam: max requests per device per 10 minutes
  maxRequestsPer10Min: 5,
};

export const BUSINESS = {
  name: "MILESTONE",
  owner: "Rhys Pullen",
  title: "Founder & DJ",
  tagline: "Festival energy. White-glove service.",
  phone: "(619) 630-5575",
  phoneHref: "tel:+16196305575",
  email: "info@milestoneweddingdj.com",
  instagram: "@milestoneweddingdj",
  instagramUrl: "https://instagram.com/milestoneweddingdj",
  website: "milestoneweddingdj.com",
  websiteUrl: "https://milestoneweddingdj.com",
  serviceArea: "San Diego · Temecula · Orange County · Los Angeles",
  services: [
    "Receptions & MC",
    "Ceremony & Cocktail Hour",
    "Lighting & Effects",
    "The Afters — Late-Night Sets",
  ],
};

export const isFirebaseConfigured = () =>
  !FIREBASE_CONFIG.apiKey.startsWith("PASTE");
