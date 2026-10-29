// TikTok cover (1080x1920) driven by script.thumbnail.
// Key content stays inside the centre 3:4 crop TikTok uses on profile grids (y 240..1680).
//
// script.thumbnail = {
//   pill:     "POV: bestie kamu tukang prank",        // small black pill on top (optional)
//   headline: ["ADA WIJEN", "DI MUKAMU?!"],            // 1-2 big lines; line 1 gets the yellow highlight
//   sticker:  "plot twist-nya 💀",                     // red sticker lower left (optional)
//   hero:     { id: "onde", expr: "panik", pose: "face", fx: ["sweat"], circ: 16 },
//   side:     { id: "bakpi", expr: "ngakak", pose: "laugh" },   // optional, peeks bottom right
//   emoji:    "💀",                                    // optional, floats near the side character
//   arrow:    true,                                    // red arrow pointing at the hero's face
//   colors:   { rays: ["#FFC2D3", "#FFE9A8"], bg: "#FFD9E3" }
// }
function renderThumb(cfg) {
  cfg = cfg || (SCRIPT && SCRIPT.thumbnail) || {};
  const cv = document.getElementById('c'); const ctx = cv.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
  const col = Object.assign({ rays: ['#FFC2D3', '#FFE9A8'], bg: '#FFD9E3' }, cfg.colors || {});
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, W, H);
  const cx = 520, cy = 1130;
  for (let i = 0; i < 28; i++) {
    const a0 = i / 28 * Math.PI * 2, a1 = (i + 0.5) / 28 * Math.PI * 2;
    ctx.fillStyle = col.rays[i % 2];
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a0) * 2400, cy + Math.sin(a0) * 2400); ctx.lineTo(cx + Math.cos(a1) * 2400, cy + Math.sin(a1) * 2400); ctx.closePath(); ctx.fill();
  }
  const g = ctx.createRadialGradient(cx, cy, 200, cx, cy, 1300); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  const base = { t: 0.37, lt: 9, dx: 0, dy: 0, sx: 1, sy: 1 };
  const hero = Object.assign({ id: 'onde', expr: 'kaget', pose: 'kaget', fx: [] }, cfg.hero || {});
  const heroSt = { ...base, ...hero, x: 500, y: 1500, s: hero.id === 'bakpi' ? 2.75 : 3.05, rot: -0.06 };
  if (hero.circ) { heroSt.circ = hero.circ; heroSt.circFrac = Array(hero.circ).fill(1); }
  if (hero.crack) heroSt.crack = hero.crack;
  drawChar(ctx, heroSt);
  if (cfg.side) {
    const sd = Object.assign({ expr: 'senang', pose: 'idle', fx: [] }, cfg.side);
    drawChar(ctx, { ...base, t: 0.2, ...sd, x: 895, y: 1800, s: sd.id === 'klepon' ? 1.6 : 1.75, rot: 0.2 });
  }
  if (cfg.emoji) {
    ctx.save(); ctx.font = `90px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(cfg.emoji, 1000, 1250); ctx.font = `64px ${FONT}`; ctx.fillText(cfg.emoji, 1010, 1420); ctx.restore();
  }
  if (cfg.arrow !== false) {
    ctx.save(); ctx.translate(880, 900); ctx.rotate(2.45); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const arrow = new Path2D('M0 0 Q90 -30 190 0 M150 -45 L195 0 L150 45');
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 46; ctx.stroke(arrow);
    ctx.strokeStyle = '#E8262A'; ctx.lineWidth = 26; ctx.stroke(arrow); ctx.restore();
  }
  // text that never overflows the frame: shrink until it fits
  const fit = (txt, size, maxW) => { ctx.font = `800 ${size}px ${FONT}`; while (ctx.measureText(txt).width > maxW && size > 40) { size -= 4; ctx.font = `800 ${size}px ${FONT}`; } return size; };
  const stroke = (txt, x, y, size, fill, sw, rot) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.wordSpacing = '10px'; size = fit(txt, size, 960);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = sw + 14; ctx.strokeStyle = '#FFFFFF'; ctx.strokeText(txt, 0, 0);
    ctx.lineWidth = sw; ctx.strokeStyle = '#1E1E1E'; ctx.strokeText(txt, 0, 0); ctx.fillStyle = fill; ctx.fillText(txt, 0, 0);
    const w = ctx.measureText(txt).width; ctx.restore(); return { size, w };
  };
  if (cfg.pill) {
    ctx.save(); ctx.wordSpacing = '8px'; const sz = fit(cfg.pill, 50, 900); const pw = ctx.measureText(cfg.pill).width + 70;
    ctx.translate(540, 330); ctx.rotate(-0.02);
    ctx.fillStyle = '#1E1E1E'; ctx.beginPath(); ctx.roundRect(-pw / 2, -46, pw, 92, 46); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(cfg.pill, 0, 4); ctx.restore();
  }
  const lines = cfg.headline || [];
  if (lines[0]) {
    ctx.save(); ctx.wordSpacing = '10px'; const sz = fit(lines[0], 150, 960); const w = ctx.measureText(lines[0]).width; ctx.restore();
    ctx.save(); ctx.translate(540, 495); ctx.rotate(-0.04); ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.roundRect(-w / 2 - 30, -sz * 0.59, w + 60, sz * 1.18, 22); ctx.fill(); ctx.restore();
    stroke(lines[0], 540, 500, 150, '#E8262A', 22, -0.04);
  }
  if (lines[1]) stroke(lines[1], 540, 670, 138, '#FFFFFF', 22, -0.04);
  if (cfg.sticker) {
    ctx.save(); ctx.translate(300, 1500); ctx.rotate(-0.1); ctx.wordSpacing = '8px'; fit(cfg.sticker, 54, 520);
    const sw2 = ctx.measureText(cfg.sticker).width + 70;
    ctx.fillStyle = '#E8262A'; ctx.beginPath(); ctx.roundRect(-sw2 / 2, -52, sw2, 104, 20); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 8; ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(cfg.sticker, 0, 4); ctx.restore();
  }
}
window.renderThumb = renderThumb;
