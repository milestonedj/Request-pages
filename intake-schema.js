// ============================================================
// Intake schema — ONE source of truth used by:
//   • intake.js       (renders the couple-facing form)
//   • dashboard.html  (renders each couple + builds the export)
// Field types: text | tel | email | date | textarea | select |
//   checks | song | dance | namelist | songlist | addons
// ============================================================

export const GENRES = [
  "Full Variety", "Current Top 40", "2000s & 2010s", "90s", "80s", "70s",
  "Oldies (50s–60s)", "Motown", "R&B / Soul", "Hip-Hop / Rap", "Dance / EDM",
  "House", "Disco", "Funk", "Country", "Rock", "Classic Rock", "Alternative",
  "Jazz", "Big Band", "Latin (Salsa / Cumbia / Merengue)", "Reggae / Reggaeton",
  "Afrobeats", "Classical",
];

// Add-on upgrades (with pricing).
export const ADDONS = [
  { id: "setRecording", label: "Record your DJ set — full audio of the night", price: 50 },
];

export const PRACTICE_FILE_PRICE = 10;

// Length options for danced songs. Default = fade, per Rhys's note that most
// couples fade after the first chorus (~90–120s).
export const LENGTH_OPTIONS = [
  { value: "fade", label: "Fade after 1st chorus (~90–120s)" },
  { value: "full", label: "Play the full song" },
  { value: "tbd", label: "TBD — decide later" },
];

export const SECTIONS = [
  {
    key: "about", title: "About you two",
    intro: "The more I know about you, the more personal the night feels. Share what you like — skip anything you'd rather not.",
    fields: [
      { id: "story", type: "textarea", label: "How did you two meet? (short version is great)" },
      { id: "together", type: "text", label: "How long have you been together?" },
      { id: "homeP1", type: "text", label: "Where does partner 1 live, and where are they from?" },
      { id: "homeP2", type: "text", label: "Where does partner 2 live, and where are they from?" },
      { id: "familiesFrom", type: "textarea", label: "Where are your families from? (heritage, hometowns — helps me honor traditions)" },
      { id: "hobbies", type: "textarea", label: "Hobbies & things you love — together and individually" },
      { id: "postWedding", type: "text", label: "Plans after the wedding (honeymoon, moving, etc.)" },
      { id: "vision", type: "textarea", label: "In a few words — the vibe & vision for your day" },
    ],
  },
  {
    key: "basics", title: "The basics",
    fields: [
      { id: "partner1", type: "text", label: "Partner 1 full name" },
      { id: "partner2", type: "text", label: "Partner 2 full name" },
      { id: "marriedName", type: "text", label: "How should I introduce you? (e.g. Mr & Mrs Smith)" },
      { id: "namePronunciation", type: "text", label: "How do we pronounce your names? (spell it out for the intro)" },
      { id: "email1", type: "email", label: "Partner 1 email" },
      { id: "email2", type: "email", label: "Partner 2 email" },
      { id: "phone1", type: "tel", label: "Partner 1 phone" },
      { id: "phone2", type: "tel", label: "Partner 2 phone" },
      { id: "weddingDate", type: "date", label: "Wedding date", required: true },
      { id: "startEnd", type: "text", label: "Start & end time", placeholder: "e.g. 4:00 – 10:00 PM" },
      { id: "officiant", type: "text", label: "Officiant name & relation to you" },
      { id: "venueName", type: "text", label: "Venue name" },
      { id: "venueCity", type: "text", label: "Venue city" },
      { id: "venueSetting", type: "select", label: "Ceremony setting",
        options: ["TBD", "Indoor", "Outdoor", "Creekside", "Garden", "Ballroom", "Beach", "Other"] },
      { id: "guestCount", type: "text", label: "Estimated guest count" },
      { id: "coordinator", type: "text", label: "Coordinator / planner (name & contact)" },
    ],
  },
  {
    key: "ceremony", title: "Ceremony music",
    intro: "Walk me through the ceremony. For background moments you can give me a vibe, a specific song, or a playlist link — whatever's easiest. Leave blank or mark TBD anything you're unsure of.",
    fields: [
      { id: "preCeremonyVibe", type: "textarea", label: "Describe the pre-ceremony vibe (as guests arrive)",
        placeholder: "e.g. soft piano, string quartet, jazz…" },
      { id: "preCeremony", type: "song", label: "…or a specific pre-ceremony song" },
      { id: "preCeremonyPlaylist", type: "url", label: "…or paste a playlist link (Spotify / Apple Music)" },
      { id: "seatingFamily", type: "song", label: "Seating of the family" },
      { id: "partyProcessional", type: "song", label: "Wedding party processional" },
      { id: "ringBearer", type: "song", label: "Ring bearer / flower girl" },
      { id: "entranceP1", type: "song", label: "Entrance — first partner down the aisle (e.g. groom)" },
      { id: "entranceP2", type: "song", label: "Entrance — second partner down the aisle (e.g. bride)" },
      { id: "recessional", type: "song", label: "Recessional — the kiss & walk back up" },
      { id: "specialCeremony", type: "text", label: "Special ceremony moment (unity candle, sand, etc.)" },
      { id: "vows", type: "select", label: "Vows",
        options: ["TBD", "Repeating after the officiant", "Reading our own vows"] },
      { id: "ceremonyEquip", type: "text", label: "Other equipment needs (extra mics, etc.)" },
      { id: "ceremonyNotes", type: "textarea", label: "Anything else about the ceremony" },
    ],
  },
  {
    key: "entrance", title: "Cocktail hour & grand entrance",
    intro: "Same idea for cocktail hour — a vibe, a song, or a playlist link, whatever's easiest.",
    fields: [
      { id: "cocktailVibe", type: "textarea", label: "Describe the cocktail hour vibe",
        placeholder: "e.g. chill lounge, jazz, Motown, upbeat pop…" },
      { id: "cocktailMusic", type: "song", label: "…or a specific cocktail song" },
      { id: "cocktailPlaylist", type: "url", label: "…or paste a playlist link (Spotify / Apple Music)" },
      { id: "grandEntrance", type: "dance", label: "Grand entrance song" },
      { id: "entranceParty", type: "namelist", label: "Wedding party entrances — names in order (+ how to say them)",
        namePlaceholder: "Name(s)", detailPlaceholder: "Phonetic spelling / role" },
      { id: "coupleEntrance", type: "text", label: "How should I announce the two of you?" },
      { id: "dancesBeforeDinner", type: "song", label: "Any dance right after the entrance? (e.g. first dance now)" },
      { id: "entranceNotes", type: "textarea", label: "Notes on the entrance" },
    ],
  },
  {
    key: "dinner", title: "Dinner service",
    fields: [
      { id: "dinnerVibe", type: "textarea", label: "Describe the dinner vibe",
        placeholder: "e.g. warm & mellow, easy background…" },
      { id: "dinnerMusic", type: "song", label: "…or a specific dinner song" },
      { id: "welcomeSpeech", type: "text", label: "Welcome speech — who?" },
      { id: "blessing", type: "text", label: "Blessing — who?" },
      { id: "mealService", type: "select", label: "Meal service",
        options: ["TBD", "Plated", "Buffet", "Stations", "Family style"] },
      { id: "mealNotes", type: "text", label: "Table-release order / buffet notes" },
      { id: "dinnerNotes", type: "textarea", label: "Notes on dinner" },
    ],
  },
  {
    key: "toasts", title: "Toasts",
    fields: [
      { id: "toasts", type: "namelist", label: "Who's toasting? Name + role",
        namePlaceholder: "Name", detailPlaceholder: "Role (+ phonetic spelling)" },
      { id: "openMic", type: "select", label: "Open mic?", options: ["No", "Yes", "TBD"] },
      { id: "thankYou", type: "text", label: "Thank-you speech — who?" },
      { id: "toastNotes", type: "textarea", label: "Notes on toasts" },
    ],
  },
  {
    key: "dances", title: "Formal dances & events",
    intro: "Heads-up on danced songs: most couples fade after the first chorus (~90–120s) — pick “full song” if you want the whole thing, or TBD to decide later. Want to rehearse to the exact edit? Add a practice file (+$" + PRACTICE_FILE_PRICE + ") and I'll send you the cut ahead of time.",
    fields: [
      { id: "firstDance", type: "dance", label: "First dance" },
      { id: "parentDance1", type: "dance", label: "Parent dance 1", who: true },
      { id: "parentDance2", type: "dance", label: "Parent dance 2", who: true },
      { id: "privateLastDance", type: "dance", label: "Private / group last dance" },
      { id: "anniversaryDance", type: "select", label: "Anniversary dance (longest-married couple)?", options: ["TBD", "Yes", "No"] },
      { id: "moneyDance", type: "select", label: "Money / dollar dance?", options: ["TBD", "Yes", "No"] },
      { id: "cakeCutting", type: "song", label: "Cake cutting song" },
      { id: "cakeCuttingPrivate", type: "select", label: "Cake cutting — public or private?",
        options: ["TBD", "In front of guests", "Private — just us"] },
      { id: "cakeMessy", type: "select", label: "Cake smash — getting messy?",
        options: ["TBD", "Keep it clean", "We're getting messy"] },
      { id: "bouquetToss", type: "song", label: "Bouquet toss" },
      { id: "garterToss", type: "song", label: "Garter toss" },
      { id: "shoeGame", type: "select", label: "Shoe game?", options: ["No", "Yes", "TBD"] },
      { id: "grandExit", type: "select", label: "Grand exit / send-off",
        options: ["TBD", "Sparklers", "Bubbles", "Streamers", "Glow sticks", "Ribbons", "None", "Other"] },
      { id: "exitImmediately", type: "select", label: "Exit right after the last dance?",
        options: ["TBD", "Yes — exit right after", "No — keep dancing"] },
      { id: "otherAnnouncements", type: "textarea", label: "Other announcements (afterparty, shuttle times, favors, closing)" },
      { id: "dancesNotes", type: "textarea", label: "Notes on dances & events" },
    ],
  },
  {
    key: "floor", title: "Dance floor preferences",
    fields: [
      { id: "floorVibe", type: "textarea", label: "Describe the dance floor vibe you want",
        placeholder: "e.g. high-energy all night, lots of throwbacks…" },
      { id: "guestRequests", type: "select", label: "Allow guest song requests?",
        options: ["TBD", "No", "Yes — with your approval", "Yes"] },
      { id: "explicit", type: "select", label: "Explicit lyrics",
        options: ["TBD", "Clean versions only", "Some is okay", "Anything goes"] },
      { id: "lineDances", type: "select", label: "Group / line dances (Cupid Shuffle, etc.)",
        options: ["TBD", "No", "Yes"] },
      { id: "lineDancesWhich", type: "text", label: "Which line dances? (if yes)" },
      { id: "crowdPriority", type: "select", label: "If the floor's empty, what do you prefer?",
        options: ["TBD", "Play what we picked", "Read the room & pivot", "A mix of both"] },
      { id: "floorNotes", type: "textarea", label: "Notes on the dance floor" },
    ],
  },
  {
    key: "mustdo", title: "Must-play & do-not-play",
    fields: [
      { id: "mustPlays", type: "songlist", label: "Must-plays — the songs that have to happen" },
      { id: "doNotPlays", type: "songlist", label: "Do-not-play — hard no's" },
    ],
  },
  {
    key: "addons", title: "Add-ons & upgrades",
    intro: "Optional extras — tap any you're curious about and we'll talk through them. No commitment here.",
    fields: [
      { id: "addons", type: "addons", label: "Upgrades", options: ADDONS },
      { id: "addonNotes", type: "textarea", label: "Questions about any add-on?" },
    ],
  },
  {
    key: "final", title: "Anything else",
    fields: [{ id: "notes", type: "textarea", label: "Anything at all you want me to know" }],
  },
];

// Which field ids are danced songs (fade-length + practice-file apply).
export const DANCE_FIELDS = SECTIONS.flatMap((s) => s.fields).filter((f) => f.type === "dance").map((f) => f.id);

// ---------- display helpers (shared by dashboard + export) ----------
const lengthLabel = (v) => (LENGTH_OPTIONS.find((o) => o.value === v) || {}).label || "";

export function songToText(s, { dance = false } = {}) {
  if (!s) return "";
  if (s.tbd) return "TBD";
  if (!s.song) return "";
  let out = s.song + (s.artist ? " — " + s.artist : "");
  if (dance) {
    const parts = [];
    if (s.length && s.length !== "fade") parts.push(lengthLabel(s.length));
    else if (s.length === "fade") parts.push("fade ~90–120s");
    if (s.practice) parts.push("practice file (+$" + PRACTICE_FILE_PRICE + ")");
    if (parts.length) out += "  (" + parts.join(" · ") + ")";
  }
  return out;
}

const listToText = (arr) => (arr && arr.length)
  ? arr.map((s) => s.song + (s.artist ? " — " + s.artist : "")).join("; ")
  : "";
const nameListToText = (arr) => (arr && arr.length)
  ? arr.map((n) => n.name + (n.detail ? " (" + n.detail + ")" : "")).filter(Boolean).join("; ")
  : "";

export function practiceCount(record) {
  return DANCE_FIELDS.reduce((n, id) => n + (record[id] && record[id].practice ? 1 : 0), 0);
}

export function addonsSummary(record) {
  const chosen = (record.addons || []);
  const items = ADDONS.filter((a) => chosen.includes(a.id));
  const pc = practiceCount(record);
  const lines = items.map((a) => `${a.label} ($${a.price})`);
  if (pc) lines.push(`${pc} practice file${pc === 1 ? "" : "s"} ($${pc * PRACTICE_FILE_PRICE})`);
  const total = items.reduce((s, a) => s + a.price, 0) + pc * PRACTICE_FILE_PRICE;
  return { lines, total };
}

// Turn a record into ordered [{section, rows:[{label, value}]}] for display/export.
// Only non-empty values are included.
export function flattenRecord(record) {
  const out = [];
  for (const sec of SECTIONS) {
    const rows = [];
    for (const f of sec.fields) {
      const v = record[f.id];
      let value = "";
      if (f.type === "song") value = songToText(v);
      else if (f.type === "dance") {
        value = songToText(v, { dance: true });
        if (f.who && record[f.id + "_who"]) value = (value ? value + " " : "") + "— " + record[f.id + "_who"];
      } else if (f.type === "songlist") value = listToText(v);
      else if (f.type === "namelist") value = nameListToText(v);
      else if (f.type === "checks") value = (v && v.length) ? v.join(", ") : "";
      else if (f.type === "addons") value = addonsSummary(record).lines.join("; ");
      else value = (v == null ? "" : String(v)).trim();
      // A dropdown left on its default "TBD" is just noise on the DJ's side —
      // hide it. (Deliberate song "TBD" picks stay, since those are meaningful.)
      if (f.type === "select" && value === "TBD") value = "";
      if (value) rows.push({ label: f.label, value });
    }
    // include add-ons total line
    if (sec.key === "addons") {
      const { total } = addonsSummary(record);
      if (total) rows.push({ label: "Estimated add-ons total", value: "$" + total });
    }
    if (rows.length) out.push({ section: sec.title, rows });
  }
  return out;
}
