// ============================================================
// Shared storage layer.
// Uses Firebase Realtime Database when configured; otherwise
// falls back to a same-device demo mode (localStorage) so you
// can preview the flow before finishing setup.
// Data model:  requests/<night YYYY-MM-DD>/<id> = {...request}
// ============================================================

import { FIREBASE_CONFIG, SETTINGS, isFirebaseConfigured } from "./config.js";

// "Event night" key — hours before nightRolloverHour count toward the
// previous calendar day, so post-midnight requests stay with tonight's event.
export function nightKey(d = new Date()) {
  const shifted = new Date(d.getTime() - SETTINGS.nightRolloverHour * 3600e3);
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, "0");
  const day = String(shifted.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function prettyDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

let mode = "local";
let fb = null;

export async function initStore(opts = {}) {
  if (isFirebaseConfigured()) {
    try {
      const appMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
      const dbMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
      const app = appMod.initializeApp(FIREBASE_CONFIG);
      fb = {
        db: dbMod.getDatabase(app),
        ref: dbMod.ref, push: dbMod.push, set: dbMod.set,
        get: dbMod.get, onValue: dbMod.onValue,
      };
      if (opts.auth) {
        const authMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
        fb.auth = authMod.getAuth(app);
        fb.authMod = authMod;
      }
      mode = "firebase";
    } catch (e) {
      console.error("Firebase failed to initialize — falling back to demo mode.", e);
      mode = "local";
    }
  }
  return mode;
}

export const storeMode = () => mode;

// ---------- owner sign-in (dashboard only) ----------
// Guests never sign in. The dashboard asks for a Google sign-in, and the
// database rules only let the owner's account read requests back.
export function requireSignIn(mountEl) {
  if (mode !== "firebase" || !fb.auth) { document.body.classList.remove("locked"); return Promise.resolve(null); }
  return new Promise((resolve) => {
    let done = false;
    fb.authMod.onAuthStateChanged(fb.auth, (user) => {
      if (user) { document.body.classList.remove("locked"); mountEl.style.display = "none"; if (!done) { done = true; resolve(user); } return; }
      document.body.classList.add("locked");
      mountEl.style.display = "block";
      mountEl.innerHTML = '<div class="card signin-card"><p class="serif-italic" style="font-size:22px">Sign in to see requests</p>'
        + '<button class="btn" id="siBtn" style="margin-top:18px">Sign in with Google</button><p class="subtle" id="siErr" style="margin-top:12px;font-size:13px"></p></div>';
      mountEl.querySelector("#siBtn").onclick = async () => {
        try { await fb.authMod.signInWithPopup(fb.auth, new fb.authMod.GoogleAuthProvider()); }
        catch (e) {
          mountEl.querySelector("#siErr").textContent = e.code === "auth/unauthorized-domain"
            ? "This address isn't on the sign-in allow list yet (Firebase > Authentication > Settings > Authorized domains)."
            : "Sign-in didn't work: " + (e.code || e.message);
        }
      };
    });
  });
}
export async function signOutOwner() { if (fb && fb.auth) await fb.authMod.signOut(fb.auth); }

// ---------- local demo fallback ----------
const LS_KEY = "mw_requests_v1";
const lsRead = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; } };
const lsWrite = (o) => localStorage.setItem(LS_KEY, JSON.stringify(o));
const localPing = () => window.dispatchEvent(new Event("mw-local-update"));

// ---------- API ----------
export async function addRequest(req) {
  const date = nightKey();
  const payload = { ...req, ts: Date.now(), played: false };
  if (mode === "firebase") {
    const node = fb.push(fb.ref(fb.db, `requests/${date}`));
    await fb.set(node, payload);
    return node.key;
  }
  const all = lsRead();
  const id = "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  (all[date] ||= {})[id] = payload;
  lsWrite(all);
  localPing();
  return id;
}

// Live subscription to one night. Returns an unsubscribe function.
export function subscribeToNight(date, cb, onErr) {
  if (mode === "firebase") {
    return fb.onValue(fb.ref(fb.db, `requests/${date}`), (snap) => cb(snap.val() || {}), (e) => onErr && onErr(e));
  }
  const fire = () => cb(lsRead()[date] || {});
  fire();
  window.addEventListener("storage", fire);
  window.addEventListener("mw-local-update", fire);
  return () => {
    window.removeEventListener("storage", fire);
    window.removeEventListener("mw-local-update", fire);
  };
}

// One-time fetch of the full archive: { "YYYY-MM-DD": { id: req } }
export async function fetchAll() {
  if (mode === "firebase") {
    const snap = await fb.get(fb.ref(fb.db, "requests"));
    return snap.val() || {};
  }
  return lsRead();
}

export async function setPlayed(date, id, played) {
  if (mode === "firebase") {
    await fb.set(fb.ref(fb.db, `requests/${date}/${id}/played`), played);
    return;
  }
  const all = lsRead();
  if (all[date] && all[date][id]) {
    all[date][id].played = played;
    lsWrite(all);
    localPing();
  }
}

// ============================================================
// Client intake (pre-consult) storage.
// Data model:  intake/<token> = { token, weddingDate, ...answers }
// The <token> is an unguessable 128-bit id — it IS the access key
// (couples reach their record via a private link containing it).
// The wedding date is a soft confirmation gate on top of that.
// ============================================================
const LS_INTAKE = "mw_intake_v1";
const lsReadIntake = () => { try { return JSON.parse(localStorage.getItem(LS_INTAKE) || "{}"); } catch { return {}; } };
const lsWriteIntake = (o) => localStorage.setItem(LS_INTAKE, JSON.stringify(o));

// Unguessable record id (32 hex chars = 128 bits).
export function genToken() {
  const a = new Uint8Array(16);
  (crypto || window.crypto).getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Create or update a couple's record (full-record write, createdAt preserved).
export async function saveIntake(token, data) {
  const payload = { ...data, token, updatedAt: Date.now() };
  if (!payload.createdAt) payload.createdAt = Date.now();
  if (mode === "firebase") {
    await fb.set(fb.ref(fb.db, `intake/${token}`), payload);
    return payload;
  }
  const all = lsReadIntake();
  all[token] = payload;
  lsWriteIntake(all);
  localPing();
  return payload;
}

export async function getIntake(token) {
  if (mode === "firebase") {
    const snap = await fb.get(fb.ref(fb.db, `intake/${token}`));
    return snap.val();
  }
  return lsReadIntake()[token] || null;
}

// Full map for the DJ dashboard: { token: {record} }
export async function fetchAllIntake() {
  if (mode === "firebase") {
    const snap = await fb.get(fb.ref(fb.db, "intake"));
    return snap.val() || {};
  }
  return lsReadIntake();
}

// Live subscription to the whole intake list (for the dashboard Couples tab).
export function subscribeIntake(cb, onErr) {
  if (mode === "firebase") {
    return fb.onValue(fb.ref(fb.db, "intake"), (snap) => cb(snap.val() || {}), (e) => onErr && onErr(e));
  }
  const fire = () => cb(lsReadIntake());
  fire();
  window.addEventListener("storage", fire);
  window.addEventListener("mw-local-update", fire);
  return () => {
    window.removeEventListener("storage", fire);
    window.removeEventListener("mw-local-update", fire);
  };
}

// ---------- song search (keyless; works from a static site) ----------
// These music APIs don't send CORS headers to a static origin, so we load
// them via JSONP (<script> tag), which is not subject to CORS at all.
// Providers are tried in order; the first that returns results wins.
// Deezer is primary because its JSONP is reliable; iTunes is a backup.
export async function searchSongs(term) {
  let anySucceeded = false;
  // Deezer (JSONP, has album art) → MusicBrainz (plain CORS fetch, very reliable,
  // no art) → iTunes (JSONP backup). If one network blocks a provider, the next
  // is tried, so search keeps working across different venue wifi / carriers.
  for (const provider of [deezerSearch, musicbrainzSearch, itunesSearch]) {
    try {
      const results = await provider(term);
      anySucceeded = true;
      if (results && results.length) return results;
    } catch {
      /* provider unreachable — fall through to the next one */
    }
  }
  // [] = we searched but found nothing;  null = every provider was unreachable
  return anySucceeded ? [] : null;
}

// MusicBrainz supports CORS with a plain fetch (no JSONP needed), so it works
// even on networks that block Deezer/iTunes. No album art available here.
async function musicbrainzSearch(term) {
  const url = "https://musicbrainz.org/ws/2/recording?fmt=json&limit=8&query="
    + encodeURIComponent(term);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("mb " + res.status);
  const data = await res.json();
  return (data.recordings || []).map((r) => ({
    trackName: r.title || "",
    artistName: (r["artist-credit"] || []).map((a) => a.name).join(", "),
    artworkUrl100: "",
  }));
}

async function deezerSearch(term) {
  const url = "https://api.deezer.com/search?limit=8&output=jsonp&q="
    + encodeURIComponent(term) + "&callback=";
  const data = await jsonp(url);
  return (data && data.data ? data.data : []).map((t) => ({
    trackName: t.title_short || t.title || "",
    artistName: (t.artist && t.artist.name) || "",
    artworkUrl100: (t.album && (t.album.cover_medium || t.album.cover_small || t.album.cover)) || "",
  }));
}

async function itunesSearch(term) {
  const url = "https://itunes.apple.com/search?media=music&entity=song&limit=8&term="
    + encodeURIComponent(term) + "&callback=";
  const data = await jsonp(url);
  return (data && data.results ? data.results : []).map((t) => ({
    trackName: t.trackName || "",
    artistName: t.artistName || "",
    artworkUrl100: (t.artworkUrl100 || "").replace("100x100", "200x200"),
  }));
}

// Generic JSONP loader — resolves with the parsed response object.
function jsonp(urlWithCallbackEq) {
  return new Promise((resolve, reject) => {
    const cbName = "mwcb_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    let done = false;
    const script = document.createElement("script");
    const cleanup = () => { try { delete window[cbName]; } catch {} script.remove(); };
    window[cbName] = (data) => { if (!done) { done = true; cleanup(); resolve(data); } };
    script.onerror = () => { if (!done) { done = true; cleanup(); reject(new Error("jsonp error")); } };
    script.src = urlWithCallbackEq + cbName;
    document.head.appendChild(script);
    setTimeout(() => { if (!done) { done = true; cleanup(); reject(new Error("timeout")); } }, 8000);
  });
}

// ---------- gentle per-device rate limit ----------
const RL_KEY = "mw_rl_v1";
export function rateLimitOk() {
  const now = Date.now();
  let arr;
  try { arr = JSON.parse(localStorage.getItem(RL_KEY) || "[]"); } catch { arr = []; }
  arr = arr.filter((t) => now - t < 10 * 60e3);
  if (arr.length >= SETTINGS.maxRequestsPer10Min) return false;
  arr.push(now);
  localStorage.setItem(RL_KEY, JSON.stringify(arr));
  return true;
}

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
