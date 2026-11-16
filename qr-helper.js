// Renders a crisp SVG QR code into `el` using the vendored
// qrcode-generator library (vendor-qrcode.js must be loaded first).
// sizePx is a CAP, not a fixed size — the CSS in styles.css (.qr-card svg)
// shrinks it further on narrow/portrait screens so it never overflows.
export function drawQR(el, text, sizePx) {
  const qr = qrcode(0, "M"); // auto type, medium error correction
  qr.addData(text);
  qr.make();
  el.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  const svg = el.firstElementChild;
  svg.style.setProperty("--qr-size", sizePx + "px");
  svg.setAttribute("aria-label", "QR code: " + text);
}
