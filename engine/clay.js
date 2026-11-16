// Clay (plasticine) look for the Yippi Squad characters.
// Everything is drawn with canvas 2D: a base colour, then soft light from the top-left,
// a darker rim, a soft specular spot and a fine grain, so shapes read as hand-made clay.
// Characters are drawn with their feet at (0, 0), about 560 units tall at scale 1.

// ---------- deterministic randomness + grain ----------
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const CLAY_GRAIN = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const d = x.createImageData(256, 256); const r = mulberry32(7);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() - 0.5) * 110; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); return c;
})();
const pxScale = (ctx) => { const m = ctx.getTransform(); return Math.hypot(m.a, m.b) || 1; };

// ---------- core clay fill ----------
// b = {x, y, w, h} bounds of the shape (used to place light), detail(ctx) draws texture before shading.
function clayShape(ctx, path, color, b, detail, o = {}) {
  const s = pxScale(ctx);
  ctx.save();
  ctx.fillStyle = color; ctx.fill(path);
  ctx.clip(path);
  if (detail) detail(ctx);
  const g = ctx.createLinearGradient(b.x, b.y, b.x + b.w * 0.55, b.y + b.h);
  g.addColorStop(0, `rgba(255,250,240,${o.light ?? 0.34})`); g.addColorStop(0.42, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(70,35,15,${o.dark ?? 0.30})`);
  ctx.fillStyle = g; ctx.fillRect(b.x - 60, b.y - 60, b.w + 120, b.h + 120);
  ctx.filter = `blur(${Math.max(1, 9 * s)}px)`;
  ctx.lineWidth = o.rim ?? 24; ctx.strokeStyle = 'rgba(70,35,15,0.22)'; ctx.stroke(path);
  if (o.spec !== false) {
    ctx.fillStyle = `rgba(255,255,255,${o.spec ?? 0.32})`;
    ctx.beginPath(); ctx.ellipse(b.x + b.w * 0.33, b.y + b.h * 0.2, b.w * 0.15, b.h * 0.07, -0.35, 0, Math.PI * 2); ctx.fill();
  }
  ctx.filter = 'none';
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = o.grain ?? 0.2;
  ctx.fillStyle = ctx.createPattern(CLAY_GRAIN, 'repeat'); ctx.fillRect(b.x - 10, b.y - 10, b.w + 20, b.h + 20);
  ctx.restore();
}
function clayBall(ctx, x, y, rx, ry, color, o) {
  const p = new Path2D(); p.ellipse(x, y, rx, ry ?? rx, o?.rot || 0, 0, Math.PI * 2);
  clayShape(ctx, p, color, { x: x - rx, y: y - (ry ?? rx), w: rx * 2, h: (ry ?? rx) * 2 }, null, { rim: Math.max(6, rx * 0.35), ...o });
}
// thick clay "sausage" along a quadratic curve (arms, legs, straps)
function clayRope(ctx, pts, w, color) {
  const [x1, y1, cx, cy, x2, y2] = pts; const s = pxScale(ctx);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const path = () => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2); };
  path(); ctx.strokeStyle = shade(color, -0.22); ctx.lineWidth = w; ctx.stroke();
  ctx.translate(-w * 0.08, -w * 0.12); path(); ctx.strokeStyle = color; ctx.lineWidth = w * 0.82; ctx.stroke();
  ctx.translate(-w * 0.06, -w * 0.08); ctx.filter = `blur(${Math.max(1, 3 * s)}px)`; path(); ctx.strokeStyle = 'rgba(255,250,240,0.35)'; ctx.lineWidth = w * 0.25; ctx.stroke();
  ctx.restore();
}
// carved line (mouth, brows, grooves): dark groove with a light lip below
function carve(ctx, d, w = 6, color = '#3A2418') {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const p = new Path2D(d);
  ctx.translate(0, w * 0.35); ctx.strokeStyle = 'rgba(255,245,230,0.45)'; ctx.lineWidth = w; ctx.stroke(p);
  ctx.translate(0, -w * 0.35); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke(p);
  ctx.restore();
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k);
  return '#' + [f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, '0')).join('');
}
// smooth closed blob through points [(x,y)...] (Catmull-Rom → Bézier)
function blobPath(pts) {
  const p = new Path2D(); const n = pts.length;
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  p.closePath(); return p;
}
// ice-cream scoop: round top, wavy drippy bottom edge
function scoopPts(cx, cy, r, seed, drip = 1) {
  const rnd = mulberry32(seed); const pts = [];
  for (let i = 0; i < 28; i++) {
    const a = i / 28 * Math.PI * 2; let rr = r * (1 + (rnd() - 0.5) * 0.035);
    const bottom = Math.max(0, Math.sin(a));
    if (bottom > 0.55) rr *= 1 + drip * (i % 2 ? 0.1 : -0.02) * bottom;
    pts.push([cx + Math.cos(a) * rr * 1.04, cy + Math.sin(a) * rr * (a > 0 && a < Math.PI ? 0.86 : 1)]);
  }
  return pts;
}

// ---------- face ----------
const SKIN_SHADOW = 'rgba(120,60,30,0.18)';
function clayEye(ctx, x, y, r, o = {}) {
  if (o.closed === 'happy') { carve(ctx, `M${x - r * 1.05} ${y + r * 0.35} Q${x} ${y - r * 0.95} ${x + r * 1.05} ${y + r * 0.35}`, r * 0.42); return; }
  if (o.closed === 'calm') { carve(ctx, `M${x - r * 1.05} ${y} Q${x} ${y + r * 0.7} ${x + r * 1.05} ${y}`, r * 0.38); if (o.lash) carve(ctx, `M${x + r} ${y} l${r * 0.45} ${-r * 0.3}`, r * 0.22); return; }
  if (o.closed === 'squeeze') { carve(ctx, `M${x - r} ${y - r * 0.6} L${x + r * 0.7} ${y} L${x - r} ${y + r * 0.6}`, r * 0.38); return; }
  const k = o.big ? 1.3 : 1;
  clayBall(ctx, x, y, r * 1.18 * k, r * 1.22 * k, '#FFFCF5', { spec: 0.15, rim: r * 0.6, dark: 0.12 });
  const pr = r * (o.small ? 0.55 : 0.92) * (o.big ? 0.75 : 1);
  const lx = x + (o.look || 0) * r * 0.25;
  const g = ctx.createRadialGradient(lx - pr * 0.3, y - pr * 0.4, pr * 0.1, lx, y, pr);
  g.addColorStop(0, '#4A4038'); g.addColorStop(1, '#141210');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, y + (o.small ? 0 : r * 0.08), pr, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(lx + pr * 0.32, y - pr * 0.35, pr * 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(lx - pr * 0.35, y + pr * 0.38, pr * 0.12, 0, Math.PI * 2); ctx.fill();
  if (o.lid) { // half-closed lid (smug / cool)
    ctx.save(); const p = new Path2D(); p.rect(x - r * 1.6, y - r * 1.6, r * 3.2, r * 1.45); ctx.clip(p);
    clayBall(ctx, x, y, r * 1.22 * k, r * 1.26 * k, o.skin, { spec: false, dark: 0.18 }); ctx.restore();
    carve(ctx, `M${x - r * 1.15} ${y - r * 0.12} L${x + r * 1.15} ${y - r * 0.12}`, r * 0.32);
  }
  if (o.lash) carve(ctx, `M${x + (o.side || 1) * r * 1.0} ${y - r * 0.7} l${(o.side || 1) * r * 0.5} ${-r * 0.32} M${x + (o.side || 1) * r * 1.15} ${y - r * 0.25} l${(o.side || 1) * r * 0.55} ${-r * 0.12}`, r * 0.22);
}
const FACES = {
  senang: { eyes: {}, brow: 'up', mouth: 'smile', blush: 1 },
  ngakak: { eyes: { closed: 'happy' }, brow: 'up', mouth: 'open', blush: 1 },
  kaget: { eyes: { big: true, small: true }, brow: 'high', mouth: 'o' },
  licik: { eyes: { lid: true, look: 1 }, brow: 'smug', mouth: 'smirk', blush: 0.6 },
  marah: { eyes: { small: true }, brow: 'angry', mouth: 'frown' },
  sedih: { eyes: {}, brow: 'sad', mouth: 'frown', tear: 1 },
  cool: { eyes: { lid: true }, brow: 'flat', mouth: 'smirk', blush: 0.4 },
  salting: { eyes: { closed: 'happy' }, brow: 'up', mouth: 'wobble', blush: 2 },
  lembut: { eyes: { closed: 'calm' }, brow: 'up', mouth: 'smile', blush: 1 },
  datar: { eyes: { small: true }, brow: 'flat', mouth: 'line' },
};
// face centred at (x, y); u = eye spacing unit (~half distance between eyes)
function clayFace(ctx, x, y, u, expr, skin, o = {}) {
  const f = FACES[expr] || FACES.senang; const r = u * 0.34;
  const ey = y, ex = u;
  if (f.blush) { ctx.save(); ctx.filter = `blur(${Math.max(1, 7 * pxScale(ctx))}px)`; ctx.fillStyle = f.blush > 1 ? 'rgba(232,96,120,0.55)' : 'rgba(232,120,120,0.35)';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * ex * 1.25, ey + u * 0.62, u * 0.36, u * 0.2, 0, 0, Math.PI * 2); ctx.fill(); } ctx.restore();
    if (f.blush > 1) for (const s of [-1, 1]) carve(ctx, `M${x + s * ex * 1.25 - u * 0.2} ${ey + u * 0.7} l${u * 0.08} ${-u * 0.16} M${x + s * ex * 1.25} ${ey + u * 0.7} l${u * 0.08} ${-u * 0.16} M${x + s * ex * 1.25 + u * 0.2} ${ey + u * 0.7} l${u * 0.08} ${-u * 0.16}`, u * 0.05, '#C9506B'); }
  if (o.freckles) { ctx.fillStyle = 'rgba(150,80,40,0.45)'; const r2 = mulberry32(3); for (const s of [-1, 1]) for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(x + s * ex * (1.05 + r2() * 0.5), ey + u * (0.4 + r2() * 0.3), u * 0.025, 0, Math.PI * 2); ctx.fill(); } }
  for (const s of [-1, 1]) clayEye(ctx, x + s * ex, ey, r, { ...f.eyes, skin, lash: o.lash, side: s });
  const bw = u * 0.09, by = ey - r * (f.eyes.big ? 2.3 : 1.85);
  const B = {
    up: (s) => `M${x + s * ex - s * r * 1.1} ${by + r * 0.15} Q${x + s * ex} ${by - r * 0.45} ${x + s * ex + s * r * 1.1} ${by + r * 0.05}`,
    high: (s) => `M${x + s * ex - s * r * 1.1} ${by} Q${x + s * ex} ${by - r * 0.7} ${x + s * ex + s * r * 1.1} ${by - r * 0.05}`,
    smug: (s) => s < 0 ? `M${x - ex - r * 1.1} ${by + r * 0.45} L${x - ex + r * 1.1} ${by + r * 0.3}` : `M${x + ex - r * 1.1} ${by + r * 0.1} Q${x + ex} ${by - r * 0.6} ${x + ex + r * 1.1} ${by - r * 0.1}`,
    angry: (s) => `M${x + s * ex + s * r * 1.2} ${by - r * 0.25} L${x + s * ex - s * r * 1.0} ${by + r * 0.55}`,
    sad: (s) => `M${x + s * ex + s * r * 1.1} ${by + r * 0.55} L${x + s * ex - s * r * 1.0} ${by - r * 0.2}`,
    flat: (s) => `M${x + s * ex - s * r * 1.05} ${by + r * 0.25} L${x + s * ex + s * r * 1.05} ${by + r * 0.25}`,
  }[f.brow];
  for (const s of [-1, 1]) carve(ctx, B(s), bw, '#3A2418');
  if (o.nose !== false) clayBall(ctx, x, ey + u * 0.42, u * 0.13, u * 0.11, shade(skin, -0.06), { spec: 0.3, rim: 4, dark: 0.35 });
  const my = ey + u * 0.78;
  const M = {
    smile: () => carve(ctx, `M${x - u * 0.28} ${my} Q${x} ${my + u * 0.26} ${x + u * 0.28} ${my}`, u * 0.075),
    smirk: () => carve(ctx, `M${x - u * 0.24} ${my + u * 0.06} Q${x + u * 0.05} ${my + u * 0.16} ${x + u * 0.3} ${my - u * 0.08}`, u * 0.075),
    frown: () => carve(ctx, `M${x - u * 0.24} ${my + u * 0.14} Q${x} ${my - u * 0.08} ${x + u * 0.24} ${my + u * 0.14}`, u * 0.075),
    line: () => carve(ctx, `M${x - u * 0.2} ${my + u * 0.05} L${x + u * 0.2} ${my + u * 0.05}`, u * 0.075),
    wobble: () => carve(ctx, `M${x - u * 0.28} ${my + u * 0.05} q${u * 0.14} ${-u * 0.1} ${u * 0.28} 0 q${u * 0.14} ${u * 0.1} ${u * 0.28} 0`, u * 0.075),
    o: () => { clayBall(ctx, x, my + u * 0.08, u * 0.15, u * 0.2, '#5A2A22', { spec: 0.1, light: 0.05 }); },
    open: () => { const p = new Path2D(`M${x - u * 0.36} ${my - u * 0.05} Q${x} ${my + u * 0.55} ${x + u * 0.36} ${my - u * 0.05} Z`);
      clayShape(ctx, p, '#6A2A26', { x: x - u * 0.36, y: my - u * 0.05, w: u * 0.72, h: u * 0.45 }, (c) => { c.fillStyle = '#E7798A'; c.beginPath(); c.ellipse(x, my + u * 0.32, u * 0.2, u * 0.12, 0, 0, Math.PI * 2); c.fill(); }, { spec: false, rim: 8 }); },
  }[f.mouth];
  M();
  if (f.tear) clayBall(ctx, x - ex - r * 0.2, ey + r * 1.9, r * 0.32, r * 0.42, '#9CC7EC', { spec: 0.6, dark: 0.1 });
}

// ---------- characters ----------
// pose: arm control points [x1,y1,cx,cy,x2,y2] for left and right arm (character's own coords)
const CLAY_POSES = {
  idle: [[-112, -205, -150, -150, -138, -95], [112, -205, 150, -150, 138, -95]],
  wave: [[-112, -205, -150, -150, -138, -95], [112, -205, 175, -260, 165, -335]],
  hips: [[-112, -205, -175, -170, -118, -130], [112, -205, 175, -170, 118, -130]],
  up: [[-112, -205, -175, -270, -160, -345], [112, -205, 175, -270, 160, -345]],
  cheek: [[-112, -205, -150, -240, -80, -290], [112, -205, 150, -240, 80, -290]],
  phone: [[-112, -205, -150, -150, -138, -95], [112, -205, 150, -150, 70, -165]],
};

const YIPPI_SQUAD = {
  waffi: {
    name: 'Waffi', role: 'tukang jail, gampang salting', skin: '#F6E8D2', headY: -372, u: 52,
    draw(ctx, o) {
      const cone = '#D99A55', limb = '#E8C493';
      for (const s of [-1, 1]) clayBall(ctx, s * 34, -18, 30, 20, limb, { rim: 8 });
      const body = new Path2D('M-128 -238 Q0 -252 128 -238 Q100 -120 62 -44 Q0 -18 -62 -44 Q-100 -120 -128 -238 Z');
      if (!o.front) for (const a of o.arms) clayRope(ctx, a, 30, limb);
      clayShape(ctx, body, cone, { x: -128, y: -252, w: 256, h: 230 }, (c) => {
        c.lineWidth = 6; for (const dir of [1, -1]) for (let i = -10; i < 10; i++) {
          c.strokeStyle = shade(cone, -0.25); c.beginPath(); c.moveTo(i * 40 - 260 * dir, -260); c.lineTo(i * 40 + 260 * dir, 20); c.stroke();
          c.strokeStyle = 'rgba(255,225,170,0.6)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(i * 40 - 260 * dir + 4, -262); c.lineTo(i * 40 + 260 * dir + 4, 18); c.stroke(); c.lineWidth = 6;
        }
      });
      clayShape(ctx, new Path2D('M-138 -262 Q0 -280 138 -262 L134 -230 Q0 -246 -134 -230 Z'), shade(cone, -0.08), { x: -138, y: -280, w: 276, h: 50 }, null, { rim: 10 });
      const head = blobPath(scoopPts(0, -380, 142, 11, 1.4));
      clayShape(ctx, head, this.skin, { x: -150, y: -522, w: 300, h: 270 });
      // chocolate drizzle "hair"
      const choco = blobPath([[-128, -430], [-110, -490], [-60, -528], [0, -538], [60, -528], [110, -492], [130, -432], [112, -418], [95, -440], [76, -398], [55, -446], [24, -428], [0, -470], [-30, -440], [-56, -460], [-78, -404], [-100, -446], [-118, -414]]);
      clayShape(ctx, choco, '#6E3B22', { x: -130, y: -540, w: 260, h: 140 }, null, { light: 0.4 });
      const r = mulberry32(5), cols = ['#F49AB0', '#9ED8C5', '#FFD66B', '#9CC7EC', '#FFFFFF'];
      for (let i = 0; i < 16; i++) { const x = -100 + r() * 200, y = -520 + r() * 70; if (y > -440 - (Math.abs(x) < 40 ? 20 : 0)) continue;
        ctx.save(); ctx.translate(x, y); ctx.rotate(r() * Math.PI); clayBall(ctx, 0, 0, 9, 4, cols[i % 5], { rim: 2, spec: 0.5 }); ctx.restore(); }
      clayFace(ctx, 0, this.headY, this.u, o.expr, this.skin, { freckles: true });
      if (o.front) for (const a of o.arms) clayRope(ctx, a, 30, limb);
      for (const a of o.arms) clayBall(ctx, a[4], a[5], 19, 19, limb, { rim: 6 });
    },
  },
  beri: {
    name: 'Beri', role: 'main character, drama queen', skin: '#F7B3C2', headY: -376, u: 52,
    draw(ctx, o) {
      const cup = '#FBF4EA', limb = '#F7C8D2';
      for (const s of [-1, 1]) clayBall(ctx, s * 38, -18, 30, 20, limb, { rim: 8 });
      if (!o.front) for (const a of o.arms) clayRope(ctx, a, 30, limb);
      const body = new Path2D('M-120 -244 L120 -244 Q104 -130 92 -48 Q0 -28 -92 -48 Q-104 -130 -120 -244 Z');
      clayShape(ctx, body, cup, { x: -120, y: -244, w: 240, h: 216 }, (c) => {
        c.fillStyle = '#F2A3B6'; for (let i = -6; i <= 6; i += 2) { c.beginPath(); c.moveTo(i * 20 - 10, -250); c.lineTo(i * 20 + 10, -250); c.lineTo(i * 16 + 8, -20); c.lineTo(i * 16 - 8, -20); c.fill(); }
      });
      clayShape(ctx, new Path2D('M-132 -268 Q0 -284 132 -268 L128 -238 Q0 -252 -128 -238 Z'), '#FFFFFF', { x: -132, y: -284, w: 264, h: 46 }, null, { rim: 10 });
      const head = blobPath(scoopPts(0, -384, 140, 23, 1.5));
      clayShape(ctx, head, this.skin, { x: -146, y: -524, w: 292, h: 270 }, (c) => {
        const r = mulberry32(9); for (let i = 0; i < 40; i++) { const x = -120 + r() * 240, y = -510 + r() * 230; if (Math.abs(x) < 105 && y > -430 && y < -315) continue; c.save(); c.translate(x, y); c.rotate(r() * 3); c.fillStyle = '#D9506E'; c.beginPath(); c.ellipse(0, 0, 6, 3.5, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
      });
      // soft-serve swirl bun on top
      clayShape(ctx, blobPath(scoopPts(6, -520, 62, 31, 0.6)), this.skin, { x: -58, y: -582, w: 128, h: 116 });
      clayShape(ctx, blobPath(scoopPts(14, -578, 32, 37, 0.3)), this.skin, { x: -18, y: -610, w: 64, h: 60 });
      clayBall(ctx, 30, -608, 12, 16, this.skin, { rot: 0.6 });
      // cherry clip
      ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#5E7A3A'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(108, -484); ctx.quadraticCurveTo(120, -530, 150, -540); ctx.stroke(); ctx.restore();
      clayBall(ctx, 104, -462, 28, 27, '#D7263D', { spec: 0.55 });
      clayFace(ctx, 0, this.headY, this.u, o.expr, this.skin, { lash: true });
      if (o.front) for (const a of o.arms) clayRope(ctx, a, 30, limb);
      for (const a of o.arms) clayBall(ctx, a[4], a[5], 19, 19, limb, { rim: 6 });
    },
  },
  matcha: {
    name: 'Mbak Matcha', role: 'kalem & cuek, idaman semua', skin: '#9DC27A', headY: -330, u: 50,
    draw(ctx, o) {
      const limb = '#B5D497';
      clayShape(ctx, new Path2D('M-22 -140 L22 -140 L22 -22 Q0 -8 -22 -22 Z'), '#DDB57E', { x: -22, y: -140, w: 44, h: 132 }, (c) => { c.strokeStyle = 'rgba(150,100,50,0.35)'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-14 + i * 6, -140); c.quadraticCurveTo(-10 + i * 6, -70, -14 + i * 6, -10); c.stroke(); } }, { rim: 6 });
      for (const s of [-1, 1]) clayBall(ctx, s * 34, -16, 26, 17, limb, { rim: 8 });
      ctx.save(); for (const s of [-1, 1]) clayRope(ctx, [s * 16, -110, s * 30, -60, s * 34, -26], 22, limb); ctx.restore();
      if (!o.front) for (const a of o.arms) clayRope(ctx, a.map((v, i) => i % 2 ? v - 40 : v * 0.95), 28, limb);
      const bar = new Path2D(); bar.moveTo(-118, -150); bar.lineTo(-118, -440); bar.quadraticCurveTo(-118, -520, -40, -522); bar.lineTo(44, -522);
      bar.arc(108, -522, 64, Math.PI, Math.PI / 2, true); bar.lineTo(118, -458); bar.lineTo(118, -150); bar.quadraticCurveTo(118, -112, 80, -112); bar.lineTo(-80, -112); bar.quadraticCurveTo(-118, -112, -118, -150); bar.closePath();
      clayShape(ctx, bar, this.skin, { x: -118, y: -522, w: 236, h: 410 }, (c) => {
        // white chocolate dip with drips
        c.fillStyle = '#FAF3E6';
        c.fill(blobPath([[-150, -580], [150, -580], [150, -446], [104, -438], [82, -402], [62, -440], [30, -434], [8, -392], [-14, -436], [-44, -432], [-66, -400], [-90, -440], [-150, -438]]));
        for (const [x, y] of [[82, -400], [8, -390], [-66, -398]]) { c.beginPath(); c.arc(x, y, 10, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = 'rgba(120,170,90,0.45)'; const r = mulberry32(4); for (let i = 0; i < 40; i++) { c.beginPath(); c.arc(-100 + r() * 200, -370 + r() * 250, 2 + r() * 2, 0, Math.PI * 2); c.fill(); }
      });
      // sunglasses pushed up
      for (const s of [-1, 1]) clayShape(ctx, (() => { const p = new Path2D(); p.roundRect(s * 50 - 38, -500, 76, 40, 18); return p; })(), '#2B2522', { x: s * 50 - 38, y: -500, w: 76, h: 40 }, null, { spec: 0.45, rim: 8 });
      carve(ctx, 'M-12 -482 Q0 -490 12 -482', 7, '#2B2522');
      clayFace(ctx, 0, this.headY, this.u, o.expr, this.skin, { lash: true, nose: true });
      if (o.front) for (const a of o.arms) clayRope(ctx, a.map((v, i) => i % 2 ? v - 40 : v * 0.95), 28, limb);
      for (const a of o.arms) clayBall(ctx, a[4] * 0.95, a[5] - 40, 18, 18, limb, { rim: 6 });
    },
  },
  vani: {
    name: 'Bu Vani', role: 'serba tahu, selalu siap traktir', skin: '#FBEFD8', headY: -388, u: 54,
    draw(ctx, o) {
      const tub = '#A9CFC6', knit = '#D9A54C', hand = '#F3DDB8';
      for (const s of [-1, 1]) clayBall(ctx, s * 44, -18, 32, 20, '#8E6E52', { rim: 8 });
      if (!o.front) for (const a of o.arms) clayRope(ctx, a.map((v, i) => i % 2 ? v : v * 1.08), 38, knit);
      const body = new Path2D('M-146 -256 L146 -256 Q136 -140 120 -46 Q0 -26 -120 -46 Q-136 -140 -146 -256 Z');
      clayShape(ctx, body, tub, { x: -146, y: -256, w: 292, h: 230 }, (c) => {
        c.fillStyle = '#F7EEDC'; c.beginPath(); c.roundRect(-140, -190, 280, 70, 12); c.fill();
        c.fillStyle = '#E6897E'; for (let i = -3; i <= 3; i++) { c.beginPath(); c.arc(i * 38, -155, 9, 0, Math.PI * 2); c.fill(); }
      });
      // cardigan fronts
      for (const s of [-1, 1]) {
        const p = new Path2D(s < 0 ? 'M-150 -262 L-60 -262 Q-70 -150 -86 -44 L-124 -48 Q-142 -150 -150 -262 Z' : 'M150 -262 L60 -262 Q70 -150 86 -44 L124 -48 Q142 -150 150 -262 Z');
        clayShape(ctx, p, knit, { x: s < 0 ? -150 : 60, y: -262, w: 90, h: 218 }, (c) => { c.strokeStyle = shade(knit, -0.2); c.lineWidth = 3; for (let y = -250; y < -40; y += 14) { c.beginPath(); c.moveTo(s * 50, y); c.lineTo(s * 155, y + 6); c.stroke(); } }, { rim: 12 });
      }
      for (const y of [-200, -140, -84]) clayBall(ctx, -72, y, 9, 9, '#F7EEDC', { rim: 3, spec: 0.5 });
      clayShape(ctx, new Path2D('M-156 -282 Q0 -298 156 -282 L152 -250 Q0 -264 -152 -250 Z'), shade(tub, 0.25), { x: -156, y: -298, w: 312, h: 48 }, null, { rim: 10 });
      const head = blobPath(scoopPts(0, -396, 146, 41, 1.2));
      clayShape(ctx, head, this.skin, { x: -152, y: -544, w: 304, h: 280 }, (c) => { c.fillStyle = 'rgba(60,35,20,0.5)'; const r = mulberry32(12); for (let i = 0; i < 26; i++) { c.beginPath(); c.ellipse(-120 + r() * 240, -520 + r() * 230, 2.5, 1.4, r() * 3, 0, Math.PI * 2); c.fill(); } });
      // rolled wafer stick like a hair pin
      ctx.save(); ctx.translate(70, -520); ctx.rotate(0.55);
      clayShape(ctx, (() => { const p = new Path2D(); p.roundRect(-18, -80, 36, 140, 16); return p; })(), '#D99A55', { x: -18, y: -80, w: 36, h: 140 }, (c) => { c.strokeStyle = '#A8692F'; c.lineWidth = 4; for (let y = -80; y < 70; y += 16) { c.beginPath(); c.moveTo(-20, y); c.lineTo(20, y + 10); c.stroke(); } }, { rim: 8 });
      ctx.restore();
      clayBall(ctx, -64, -520, 22, 12, '#7DB36A', { rot: -0.6 }); clayBall(ctx, -38, -530, 20, 11, '#8CC278', { rot: 0.5 });
      clayFace(ctx, 0, this.headY, this.u, o.expr, this.skin, { lash: true });
      // round glasses
      ctx.save(); ctx.lineWidth = 6; ctx.strokeStyle = '#7A4E2E'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * this.u, this.headY, this.u * 0.62, 0, Math.PI * 2); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-this.u * 0.38, this.headY - 6); ctx.quadraticCurveTo(0, this.headY - 16, this.u * 0.38, this.headY - 6); ctx.stroke(); ctx.restore();
      if (o.front) for (const a of o.arms) clayRope(ctx, a.map((v, i) => i % 2 ? v : v * 1.08), 38, knit);
      for (const a of o.arms) clayBall(ctx, a[4] * 1.08, a[5], 20, 20, hand, { rim: 6 });
    },
  },
};

function drawClayChar(ctx, id, x, y, s, expr = 'senang', pose = 'idle', opts = {}) {
  const C = YIPPI_SQUAD[id];
  ctx.save(); ctx.translate(x, y);
  // contact shadow on the floor
  ctx.save(); ctx.filter = `blur(${Math.max(2, 14 * s * pxScale(ctx))}px)`; ctx.fillStyle = 'rgba(90,55,30,0.32)';
  ctx.beginPath(); ctx.ellipse(18 * s, 6 * s, 150 * s, 26 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.scale(s, s); if (opts.rot) ctx.rotate(opts.rot);
  C.draw(ctx, { expr, arms: CLAY_POSES[pose] || CLAY_POSES.idle, front: ['cheek', 'phone'].includes(pose) });
  ctx.restore();
}

// warm seamless paper backdrop, like a tabletop clay set
function clayBackdrop(ctx, W, H, o = {}) {
  const top = o.top || '#F1E6D4', bot = o.bottom || '#E4D3BB';
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(o.floor ?? 0.72, shade(top, -0.04)); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const v = ctx.createRadialGradient(W * 0.5, H * 0.45, Math.min(W, H) * 0.25, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
  v.addColorStop(0, 'rgba(255,250,240,0.25)'); v.addColorStop(1, 'rgba(90,60,30,0.22)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.08; ctx.fillStyle = ctx.createPattern(CLAY_GRAIN, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
}

// chunky clay letters
function clayText(ctx, txt, x, y, size, color, o = {}) {
  const font = `800 ${size}px "Pop", sans-serif`;
  ctx.save(); ctx.font = font; const w = ctx.measureText(txt).width + size; const h = size * 1.6;
  const oc = document.createElement('canvas'); oc.width = Math.ceil(w); oc.height = Math.ceil(h); const c = oc.getContext('2d');
  c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = size * 0.12;
  const cx = w / 2, cy = h / 2;
  for (let i = 8; i > 0; i--) { c.fillStyle = c.strokeStyle = shade(color, -0.32); c.fillText(txt, cx + i * 0.6, cy + i * 0.9); c.strokeText(txt, cx + i * 0.6, cy + i * 0.9); }
  c.fillStyle = c.strokeStyle = color; c.fillText(txt, cx, cy); c.strokeText(txt, cx, cy);
  c.globalCompositeOperation = 'source-atop';
  const g = c.createLinearGradient(0, cy - size * 0.6, 0, cy + size * 0.6); g.addColorStop(0, 'rgba(255,250,240,0.45)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(70,35,15,0.25)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.globalAlpha = 0.1; c.fillStyle = c.createPattern(CLAY_GRAIN, 'repeat'); c.fillRect(0, 0, w, h);
  ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot);
  ctx.shadowColor = 'rgba(90,55,30,0.35)'; ctx.shadowBlur = size * 0.25; ctx.shadowOffsetX = size * 0.06; ctx.shadowOffsetY = size * 0.12;
  ctx.drawImage(oc, -w / 2, -h / 2); ctx.restore();
  return w - size;
}
window.Clay = { drawClayChar, clayBackdrop, clayText, YIPPI_SQUAD, FACES, CLAY_POSES };
