// ============================================================
// Pre-consult intake form — schema-driven renderer, song pickers,
// save/load flow. Schema lives in intake-schema.js.
// ============================================================
import { initStore, saveIntake, getIntake, genToken, searchSongs, esc } from "./app.js?v=4";
import { SETTINGS, BUSINESS, EMAILJS, isEmailConfigured } from "./config.js?v=5";
import { SECTIONS, GENRES, ADDONS, LENGTH_OPTIONS, PRACTICE_FILE_PRICE, DANCE_FIELDS, addonsSummary }
  from "./intake-schema.js?v=2";

const $ = (id) => document.getElementById(id);

// registries of live field getters, keyed by field id
const getters = {};

// auto-grow a textarea so text wraps and the box grows with the content
function growTextarea(ta) {
  ta.style.height = "auto";
  ta.style.height = Math.max(ta.scrollHeight, 24) + "px";
}
function wireAutoGrow(ta) {
  ta.addEventListener("input", () => growTextarea(ta));
  // grow once now (and again when its section first opens, since hidden = 0 height)
  requestAnimationFrame(() => growTextarea(ta));
}

// ---------- Deezer search wiring (shared) ----------
function wireSongSearch(inputEl, resultsEl, onPick) {
  let timer = null, seq = 0;
  inputEl.addEventListener("input", () => {
    clearTimeout(timer);
    const term = inputEl.value.trim();
    if (term.length < 2) { resultsEl.innerHTML = ""; return; }
    resultsEl.innerHTML = '<div class="pk-hint"><span class="spin"></span> searching…</div>';
    timer = setTimeout(async () => {
      const my = ++seq;
      let items;
      try { items = await searchSongs(term); } catch { items = null; }
      if (my !== seq) return;
      if (items === null || !items.length) {
        resultsEl.innerHTML = `<div class="pk-hint">${items === null ? "Search is busy." : "No matches."} <button type="button" class="pk-manual link">enter it manually</button></div>`;
      } else {
        resultsEl.innerHTML = items.map((t, i) => `
          <div class="pk-row" role="button" tabindex="0" data-i="${i}">
            ${t.artworkUrl100 ? `<img class="pk-art" src="${esc(t.artworkUrl100)}" alt="" loading="lazy">` : `<div class="pk-art"></div>`}
            <div class="pk-meta"><div class="pk-title">${esc(t.trackName)}</div><div class="pk-artist">${esc(t.artistName)}</div></div>
          </div>`).join("");
        const pick = (i) => onPick({ song: items[i].trackName, artist: items[i].artistName, art: items[i].artworkUrl100 || "" });
        resultsEl.querySelectorAll(".pk-row").forEach((r) => {
          r.addEventListener("click", () => pick(+r.dataset.i));
          r.addEventListener("keydown", (e) => { if (e.key === "Enter") pick(+r.dataset.i); });
        });
      }
      const mb = resultsEl.querySelector(".pk-manual");
      if (mb) mb.addEventListener("click", () => {
        const song = inputEl.value.trim();
        if (song) onPick({ song, artist: "", art: "" });
      });
    }, 350);
  });
}

// ---------- single song picker (basic) ----------
function makeSongPicker(mountEl, initial, opts = {}) {
  let value = normalizeSong(initial);
  render();
  function render() {
    if (value && value.tbd) {
      mountEl.innerHTML = `<div class="pk-picked"><div class="pk-meta"><div class="pk-title pk-dim">TBD — decide later</div></div><button type="button" class="pk-change">change</button></div>`;
      mountEl.querySelector(".pk-change").addEventListener("click", () => { value = null; render(); });
    } else if (value && value.song) {
      mountEl.innerHTML = `
        <div class="pk-picked">
          ${value.art ? `<img class="pk-art" src="${esc(value.art)}" alt="">` : `<div class="pk-art"></div>`}
          <div class="pk-meta"><div class="pk-title">${esc(value.song)}</div><div class="pk-artist">${value.artist ? esc(value.artist) : '<span class="pk-dim">artist —</span>'}</div></div>
          <button type="button" class="pk-change">change</button>
        </div>
        ${opts.extra ? opts.extra(value) : ""}`;
      mountEl.querySelector(".pk-change").addEventListener("click", () => { value = keepMeta(value); value.song = ""; render(); });
      if (opts.wireExtra) opts.wireExtra(mountEl, value, render);
    } else {
      mountEl.innerHTML = `
        <input class="input pk-input" type="search" autocomplete="off" placeholder="Search a song or artist…">
        <div class="pk-results"></div>
        <button type="button" class="link pk-tbd">Mark TBD</button>`;
      const input = mountEl.querySelector(".pk-input");
      wireSongSearch(input, mountEl.querySelector(".pk-results"), (sel) => { value = { ...keepMeta(value), ...sel }; render(); });
      mountEl.querySelector(".pk-tbd").addEventListener("click", () => { value = { ...keepMeta(value), tbd: true, song: "", artist: "", art: "" }; render(); });
    }
  }
  function keepMeta(v) { return { length: v?.length, practice: v?.practice, who: v?.who }; }
  return { get: () => (value && (value.song || value.tbd) ? clean(value) : null) };
}
function normalizeSong(s) { return s && (s.song || s.tbd) ? { ...s } : null; }
function clean(v) { const o = { song: v.song || "", artist: v.artist || "", art: v.art || "" }; if (v.tbd) o.tbd = true; if (v.length) o.length = v.length; if (v.practice) o.practice = true; return o; }

// ---------- dance picker (song + fade-length + practice add-on) ----------
function makeDancePicker(mountEl, initial) {
  const value = { length: "fade", practice: false, ...normalizeSong(initial) };
  if (!value.length) value.length = "fade";
  const inner = document.createElement("div");
  mountEl.appendChild(inner);
  const controls = document.createElement("div");
  controls.className = "dance-controls";
  mountEl.appendChild(controls);

  const picker = makeSongPicker(inner, value);
  renderControls();
  function renderControls() {
    controls.innerHTML = `
      <div class="dance-row">
        <label class="mini-label">Length</label>
        <select class="input mini-select" data-role="length">
          ${LENGTH_OPTIONS.map((o) => `<option value="${o.value}" ${value.length === o.value ? "selected" : ""}>${esc(o.label)}</option>`).join("")}
        </select>
      </div>
      <label class="practice-toggle">
        <input type="checkbox" data-role="practice" ${value.practice ? "checked" : ""}>
        <span>Have Rhys create &amp; send a practice file ahead of time <strong>(+$${PRACTICE_FILE_PRICE})</strong></span>
      </label>`;
    controls.querySelector('[data-role="length"]').addEventListener("change", (e) => { value.length = e.target.value; });
    controls.querySelector('[data-role="practice"]').addEventListener("change", (e) => { value.practice = e.target.checked; updateAddonTotal(); });
  }
  return { get: () => {
    const s = picker.get();
    if (!s) return null;
    s.length = value.length;
    if (value.practice) s.practice = true;
    return s;
  } };
}

// ---------- song list (must-play / do-not-play) ----------
function makeListPicker(mountEl, initialArr) {
  let items = Array.isArray(initialArr) ? initialArr.filter((x) => x && x.song) : [];
  render();
  function render() {
    mountEl.innerHTML = `
      <div class="pk-list"></div>
      <input class="input pk-input" type="search" autocomplete="off" placeholder="Search a song to add…">
      <div class="pk-results"></div>
      <button type="button" class="link pk-manual-add">or add one manually</button>`;
    const list = mountEl.querySelector(".pk-list");
    list.innerHTML = items.length ? items.map((it, i) => `
      <div class="pk-chip">${it.art ? `<img class="pk-art sm" src="${esc(it.art)}" alt="">` : ""}
        <span class="pk-chip-text">${esc(it.song)}${it.artist ? " — " + esc(it.artist) : ""}</span>
        <button type="button" class="pk-remove" data-i="${i}" aria-label="Remove">×</button></div>`).join("")
      : `<div class="pk-dim" style="padding:4px 2px">Nothing added yet.</div>`;
    list.querySelectorAll(".pk-remove").forEach((b) => b.addEventListener("click", () => { items.splice(+b.dataset.i, 1); render(); }));
    const input = mountEl.querySelector(".pk-input");
    wireSongSearch(input, mountEl.querySelector(".pk-results"), (sel) => { items.push(sel); render(); });
    mountEl.querySelector(".pk-manual-add").addEventListener("click", () => {
      const song = input.value.trim(); if (song) { items.push({ song, artist: "", art: "" }); render(); }
    });
  }
  return { get: () => items };
}

// ---------- name list (wedding party / toasts) ----------
function makeNameList(mountEl, initialArr, ph) {
  let items = Array.isArray(initialArr) ? initialArr.filter((x) => x && (x.name || x.detail)) : [];
  if (!items.length) items = [{ name: "", detail: "" }];
  render();
  function render() {
    mountEl.innerHTML = `<div class="nl-rows"></div><button type="button" class="link nl-add">+ add another</button>`;
    const rows = mountEl.querySelector(".nl-rows");
    rows.innerHTML = items.map((it, i) => `
      <div class="nl-row">
        <input class="input nl-name" data-i="${i}" placeholder="${esc(ph.namePlaceholder || "Name")}" value="${esc(it.name || "")}">
        <input class="input nl-detail" data-i="${i}" placeholder="${esc(ph.detailPlaceholder || "Detail")}" value="${esc(it.detail || "")}">
        <button type="button" class="pk-remove" data-i="${i}" aria-label="Remove">×</button>
      </div>`).join("");
    rows.querySelectorAll(".nl-name").forEach((el) => el.addEventListener("input", () => items[+el.dataset.i].name = el.value));
    rows.querySelectorAll(".nl-detail").forEach((el) => el.addEventListener("input", () => items[+el.dataset.i].detail = el.value));
    rows.querySelectorAll(".pk-remove").forEach((b) => b.addEventListener("click", () => { items.splice(+b.dataset.i, 1); if (!items.length) items = [{ name: "", detail: "" }]; render(); }));
    mountEl.querySelector(".nl-add").addEventListener("click", () => { items.push({ name: "", detail: "" }); render(); });
  }
  return { get: () => items.filter((x) => x.name || x.detail) };
}

// ---------- add-ons ----------
function makeAddons(mountEl, initialArr) {
  const chosen = new Set(Array.isArray(initialArr) ? initialArr : []);
  mountEl.innerHTML = ADDONS.map((a) => `
    <label class="addon-row">
      <input type="checkbox" value="${a.id}" ${chosen.has(a.id) ? "checked" : ""}>
      <span class="addon-name">${esc(a.label)}${a.note ? ` <em>(${esc(a.note)})</em>` : ""}</span>
      <span class="addon-price">$${a.price}</span>
    </label>`).join("") + `<div class="addon-total" id="addonTotal"></div>`;
  mountEl.querySelectorAll('input[type="checkbox"]').forEach((c) =>
    c.addEventListener("change", () => { c.checked ? chosen.add(c.value) : chosen.delete(c.value); updateAddonTotal(); }));
  return { get: () => [...chosen] };
}

// live add-ons + practice-file total
function updateAddonTotal() {
  const el = $("addonTotal");
  if (!el) return;
  const rec = collect(true); // shallow collect for totals
  const { lines, total } = addonsSummary(rec);
  el.innerHTML = total
    ? `<strong>Estimated add-ons:</strong> ${lines.join(" · ")} &nbsp;=&nbsp; <strong>$${total}</strong>`
    : "";
}

// ---------- field renderer ----------
function renderField(f, prefill) {
  const wrap = document.createElement("div");
  wrap.className = "field";
  const labelHtml = `<label class="field-label" for="fld_${f.id}">${esc(f.label)}${f.required ? ' <span class="req-star">*</span>' : ""}</label>`;

  if (["tel", "email", "date", "url"].includes(f.type)) {
    const ph = f.placeholder || (f.type === "url" ? "https://…" : "");
    wrap.innerHTML = `${labelHtml}<input class="input" id="fld_${f.id}" type="${f.type}" ${ph ? `placeholder="${esc(ph)}"` : ""} maxlength="400">`;
    if (prefill[f.id] != null) wrap.querySelector("input").value = prefill[f.id];
    getters[f.id] = () => wrap.querySelector("input").value.trim();
  } else if (f.type === "text") {
    // single-line-looking, but a textarea so long entries WRAP and grow instead of scrolling off
    wrap.innerHTML = `${labelHtml}<textarea class="input autogrow" id="fld_${f.id}" rows="1" maxlength="400" ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ""}></textarea>`;
    const ta = wrap.querySelector("textarea");
    if (prefill[f.id] != null) ta.value = prefill[f.id];
    wireAutoGrow(ta);
    getters[f.id] = () => ta.value.trim();
  } else if (f.type === "textarea") {
    wrap.innerHTML = `${labelHtml}<textarea class="input autogrow" id="fld_${f.id}" rows="1" maxlength="2000" ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ""}></textarea>`;
    const ta = wrap.querySelector("textarea");
    if (prefill[f.id] != null) ta.value = prefill[f.id];
    wireAutoGrow(ta);
    getters[f.id] = () => ta.value.trim();
  } else if (f.type === "select") {
    wrap.innerHTML = `${labelHtml}<select class="input" id="fld_${f.id}">${f.options.map((o) => `<option ${prefill[f.id] === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    getters[f.id] = () => wrap.querySelector("select").value;
  } else if (f.type === "checks") {
    const chosen = new Set(prefill[f.id] || []);
    wrap.innerHTML = `${labelHtml}<div class="chip-grid">${f.options.map((o) => `<label class="chip-check"><input type="checkbox" value="${esc(o)}" ${chosen.has(o) ? "checked" : ""}> ${esc(o)}</label>`).join("")}</div>`;
    getters[f.id] = () => [...wrap.querySelectorAll("input:checked")].map((c) => c.value);
  } else if (f.type === "song") {
    wrap.innerHTML = `${labelHtml}<div class="picker"></div>`;
    getters[f.id] = makeSongPicker(wrap.querySelector(".picker"), prefill[f.id]).get;
  } else if (f.type === "dance") {
    let whoHtml = "";
    if (f.who) whoHtml = `<input class="input dance-who" id="who_${f.id}" placeholder="Whose dance? (e.g. Bride & Father)" maxlength="120">`;
    wrap.innerHTML = `${labelHtml}${whoHtml}<div class="picker"></div>`;
    if (f.who && prefill[f.id + "_who"]) wrap.querySelector(".dance-who").value = prefill[f.id + "_who"];
    const dp = makeDancePicker(wrap.querySelector(".picker"), prefill[f.id]);
    getters[f.id] = dp.get;
    if (f.who) getters[f.id + "_who"] = () => wrap.querySelector(".dance-who").value.trim();
  } else if (f.type === "songlist") {
    wrap.innerHTML = `${labelHtml}<div class="picker"></div>`;
    getters[f.id] = makeListPicker(wrap.querySelector(".picker"), prefill[f.id]).get;
  } else if (f.type === "namelist") {
    wrap.innerHTML = `${labelHtml}<div class="picker"></div>`;
    getters[f.id] = makeNameList(wrap.querySelector(".picker"), prefill[f.id], f).get;
  } else if (f.type === "addons") {
    wrap.innerHTML = `${labelHtml}<div class="picker"></div>`;
    getters[f.id] = makeAddons(wrap.querySelector(".picker"), prefill[f.id]).get;
  }
  return wrap;
}

function buildForm(prefill = {}) {
  const root = $("formSections");
  root.innerHTML = "";
  SECTIONS.forEach((sec, idx) => {
    const s = document.createElement("div");
    s.className = "accordion" + (idx === 0 ? " open" : "");
    s.dataset.key = sec.key;

    const head = document.createElement("button");
    head.type = "button";
    head.className = "acc-head";
    head.innerHTML = `<span class="acc-num">${String(idx + 1).padStart(2, "0")}</span><span class="acc-title">${esc(sec.title)}</span><span class="acc-caret">▾</span>`;
    head.addEventListener("click", () => {
      s.classList.toggle("open");
      if (s.classList.contains("open")) s.querySelectorAll("textarea.autogrow").forEach(growTextarea);
    });

    const body = document.createElement("div");
    body.className = "acc-body";
    if (sec.intro) { const p = document.createElement("p"); p.className = "sec-note"; p.textContent = sec.intro; body.appendChild(p); }
    const grid = document.createElement("div");
    grid.className = "fields";
    sec.fields.forEach((f) => grid.appendChild(renderField(f, prefill)));
    body.appendChild(grid);

    s.appendChild(head);
    s.appendChild(body);
    root.appendChild(s);
  });
  updateAddonTotal();
}

// open the accordion that contains a given element (used on validation focus)
function openSectionFor(el) {
  const acc = el && el.closest(".accordion");
  if (acc) acc.classList.add("open");
}

// ---------- collect ----------
function collect(shallow = false) {
  const data = {};
  for (const [id, getter] of Object.entries(getters)) {
    try {
      const v = getter();
      if (v == null) continue;
      if (Array.isArray(v) && !v.length) continue;
      if (typeof v === "string" && !v) continue;
      data[id] = v;
    } catch { /* getter for a not-yet-mounted field */ }
  }
  return data;
}

// ---------- flow ----------
let currentToken = null;

async function init() {
  $("brandName").textContent = BUSINESS.name;
  $("tagline").textContent = BUSINESS.tagline;
  $("brandFoot").textContent = BUSINESS.name + " — " + BUSINESS.website;
  const mode = await initStore();
  if (mode !== "firebase") $("demoBanner").style.display = "block";

  const token = new URLSearchParams(location.search).get("c");
  if (token) {
    const record = await getIntake(token);
    if (!record) { showView("notFound"); return; }
    currentToken = token;
    showView("gate");
    $("gateBtn").addEventListener("click", () => {
      if ($("gateDate").value && $("gateDate").value === record.weddingDate) {
        buildForm(record); $("formTitle").textContent = "Edit your details"; showView("form");
      } else $("gateError").style.display = "block";
    });
  } else {
    buildForm({}); showView("form");
  }
  $("saveBtn").addEventListener("click", onSave);
}

function showView(name) {
  ["form", "gate", "saved", "notFound"].forEach((v) => { const el = $("view-" + v); if (el) el.style.display = v === name ? "" : "none"; });
  window.scrollTo({ top: 0 });
}

async function onSave() {
  const data = collect();
  if (!data.partner1 && !data.partner2) { flash("Please add at least one name so I know who this is."); return; }
  if (!data.weddingDate) { flash("Please add your wedding date — it's how you'll get back in later."); const el = $("fld_weddingDate"); if (el) { openSectionFor(el); el.scrollIntoView({ behavior: "smooth", block: "center" }); el.focus(); } return; }
  const isNew = !currentToken;
  $("saveBtn").disabled = true; $("saveBtn").textContent = "Saving…";
  try {
    if (!currentToken) currentToken = genToken();
    if (data.createdAt == null) {
      const existing = await getIntake(currentToken).catch(() => null);
      if (existing && existing.createdAt) data.createdAt = existing.createdAt;
    }
    await saveIntake(currentToken, data);
    const link = location.origin + location.pathname + "?c=" + currentToken;
    $("savedLink").value = link; $("savedLink").setAttribute("data-link", link);
    // email the couple a confirmation with their link (submit + every save)
    const emails = [data.email1, data.email2].filter((e) => e && /.+@.+\..+/.test(e));
    const emailedTo = await sendConfirmations(emails, data, link, isNew);
    $("savedEmailNote").textContent = emailedTo.length
      ? "We also emailed your link to " + emailedTo.join(" and ") + "."
      : "";
    $("savedEmailNote").style.display = emailedTo.length ? "" : "none";
    showView("saved");
  } catch (e) {
    console.error(e); flash("That didn't save — check your connection and try again.");
  } finally { $("saveBtn").disabled = false; $("saveBtn").textContent = "Save my details"; }
}

// Email each provided address a confirmation with the link (via EmailJS REST).
// Fire-and-forget-ish: we await so we can report who we emailed, but a failure
// never blocks the save. Returns the list of addresses we successfully emailed.
async function sendConfirmations(emails, data, link, isNew) {
  if (!isEmailConfigured() || !emails.length) return [];
  const couple = [data.partner1, data.partner2].filter(Boolean).join(" & ") || "your wedding";
  const ok = [];
  await Promise.all(emails.map(async (to) => {
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS.serviceId,
          template_id: EMAILJS.templateId,
          user_id: EMAILJS.publicKey,
          template_params: {
            // recipient under several common names so the template "To" field
            // works whether it's {{to_email}}, {{email}}, or {{user_email}}
            to_email: to,
            email: to,
            user_email: to,
            reply_to: to,
            couple,
            link,
            wedding_date: data.weddingDate || "",
            action: isNew ? "submitted your pre-consult" : "saved changes to your pre-consult",
            dj_name: BUSINESS.owner,
            business: BUSINESS.name,
          },
        }),
      });
      if (res.ok) ok.push(to);
      else console.warn("EmailJS responded", res.status, await res.text().catch(() => ""));
    } catch (e) { console.warn("EmailJS send failed for", to, e); }
  }));
  return ok;
}

function flash(msg) { const el = $("formFlash"); el.textContent = msg; el.style.display = "block"; el.scrollIntoView({ behavior: "smooth", block: "center" }); }

document.addEventListener("click", (e) => {
  if (e.target.id === "copyLink") {
    const link = $("savedLink").getAttribute("data-link");
    navigator.clipboard?.writeText(link).then(
      () => { e.target.textContent = "Copied!"; setTimeout(() => (e.target.textContent = "Copy link"), 1800); },
      () => $("savedLink").select());
  }
  if (e.target.id === "backToEdit") showView("form");
});

init();
