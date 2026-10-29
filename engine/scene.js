// yippi-animasi engine. Draws one 1080x1920 frame at time t from a script loaded with loadScript().
const W = 1080, H = 1920, K = '#2C2C2A';
const FONT = '"Pop", "Noto Color Emoji", sans-serif';

// ---------- script ----------
const TWO = { z: 1.15, cx: 545, cy: 1060 };
const CAM_PRESETS = { two: TWO, wide: { z: 1.0, cx: 540, cy: 990 } };
let BEATS = [], TOTAL = 0, SCRIPT = null;
function loadScript(s) {
  SCRIPT = s; BEATS = s.beats.map((b) => ({ ...b }));
  let acc = 0;
  for (const b of BEATS) {
    if (typeof b.cam === 'string') b.cam = { ...CAM_PRESETS[b.cam] };
    else if (b.cam && b.cam.preset) b.cam = { ...CAM_PRESETS[b.cam.preset], ...b.cam };
    b.t0 = acc; acc += b.dur;
  }
  TOTAL = acc; window.BEATS = BEATS; window.TOTAL = TOTAL;
  return { total: TOTAL, beats: BEATS.length };
}
window.loadScript = loadScript;
// ---------- helpers ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => (k = clamp(k, 0, 1), k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const easeOutBack = (k) => { k = clamp(k, 0, 1); const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function beatAt(t) { for (let i = BEATS.length - 1; i >= 0; i--) if (t >= BEATS[i].t0) return i; return 0; }

function P(ctx, d, fill, stroke, lw) {
  const p = new Path2D(d);
  if (fill) { ctx.fillStyle = fill; ctx.fill(p); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(p); }
}
function circ(ctx, x, y, r, fill, stroke, lw) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 4; ctx.stroke(); }
}
function ell(ctx, x, y, rx, ry, fill, stroke, lw, rot) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 4; ctx.stroke(); }
}

// ---------- characters ----------
const ONDE_SESAME = [[82,118,30],[68,168,80],[86,222,-30],[128,246,10],[176,246,-10],[214,222,30],[232,168,-80],[218,116,-30],[150,84,0],[116,92,-20],[184,92,20],[100,200,60],[200,200,-60],[150,226,0],[140,118,40],[162,122,-40]];
const CIRC_ORDER = [11, 12, 14, 0, 6, 8, 2, 4, 10, 15, 5, 13, 3, 7, 1, 9];
const CH = {
  bakpi: { skin: '#F2D3A0',
    body(ctx) { P(ctx, 'M150 70 C230 70 252 120 250 175 C248 235 205 258 150 258 C95 258 52 235 50 175 C48 120 70 70 150 70Z', '#F2D3A0', K, 5);
      circ(ctx, 88, 120, 7, '#D9A15E'); circ(ctx, 215, 215, 9, '#D9A15E'); circ(ctx, 200, 105, 5, '#D9A15E'); circ(ctx, 80, 210, 6, '#D9A15E'); },
    acc(ctx) { P(ctx, 'M98 82 Q150 40 202 82 Q150 98 98 82Z', '#5C3A1E', K, 4);
      ctx.setLineDash([6, 5]); P(ctx, 'M112 76 Q150 56 188 76', null, '#C98B4B', 3); ctx.setLineDash([]);
      P(ctx, 'M200 80 Q218 74 222 88 Q210 92 200 80Z', '#5C3A1E', K, 3); } },
  onde: { skin: '#E0A04E',
    body(ctx, st) { circ(ctx, 150, 165, 95, '#E0A04E', K, 5);
      for (const [x, y, r] of ONDE_SESAME) ell(ctx, x, y, 5.5, 2.8, '#FFF3D6', null, 0, r * Math.PI / 180); },
    acc(ctx) { ctx.save(); ctx.translate(112, 82); ctx.rotate(-18 * Math.PI / 180); ctx.translate(-112, -82);
      P(ctx, 'M112 82 L84 66 L86 98Z', '#ED93B1', K, 4); P(ctx, 'M112 82 L140 66 L138 98Z', '#ED93B1', K, 4); circ(ctx, 112, 82, 8, '#D4537E', K, 4); ctx.restore(); },
    lash(ctx) { P(ctx, 'M106 140 l-7 -6 M110 137 l-4 -8 M194 140 l7 -6 M190 137 l4 -8', null, K, 3); } },
  klepon: { skin: '#7DBE5A',
    body(ctx) { circ(ctx, 150, 168, 90, '#7DBE5A', K, 5); P(ctx, 'M232 176 q8 20 0 34 q-8 -8 0 -34', '#7A4A1E'); },
    acc(ctx) { P(ctx, 'M70 120 Q76 78 150 74 Q224 78 230 120 Q214 108 204 118 Q194 102 180 114 Q168 98 154 112 Q140 98 128 112 Q114 100 104 116 Q88 104 70 120Z', '#FFFDF7', K, 5);
      ctx.fillStyle = K; ctx.beginPath(); ctx.roundRect(108, 66, 34, 18, 8); ctx.roundRect(158, 66, 34, 18, 8); ctx.fill(); P(ctx, 'M142 74 L158 74', null, K, 3); } },
};

const POSES = {
  idle: [[62,170,44,185,48,205],[238,170,256,185,252,205]],
  up: [[62,170,40,150,36,128],[238,170,260,150,264,128]],
  hips: [[62,170,48,190,70,205],[238,170,252,190,230,205]],
  down: [[62,170,48,195,52,215],[238,170,252,195,248,215]],
  kaget: [[62,170,36,160,30,140],[238,170,264,160,270,140]],
  pointL: [[62,170,30,165,4,148],[238,170,256,185,252,205]],
  face: [[62,170,62,205,100,178],[238,170,238,205,200,178]],
  phone: [[62,170,44,185,48,205],[238,170,258,212,222,212]],
  blangkon: [[62,170,44,185,48,205],[238,170,284,120,222,84]],
  wave: [[62,170,44,185,48,205],[238,170,268,140,262,100]],
  laugh: [[62,170,70,222,118,222],[238,170,230,222,182,222]],
  nails: [[62,170,48,190,70,205],[238,170,262,190,206,198]],
};
const FRONT = { face: 1, phone: 1, blangkon: 1, laugh: 1, nails: 1 };

const EX = {
  senang: { b: ['M105 128 Q118 120 131 126', 'M169 126 Q182 120 195 128'], eyes: 'dot', m: (c) => P(c, 'M128 180 Q150 205 172 180 Z', '#A32D2D', K, 5), ck: 1 },
  marah: { b: ['M102 124 L134 140', 'M198 124 L166 140'], eyes: 'dot8', m: (c) => P(c, 'M130 196 Q150 182 170 196', null, K, 5) },
  sedih: { b: ['M104 136 L130 124', 'M196 136 L170 124'], eyes: 'dot8', m: (c) => P(c, 'M130 196 Q150 180 170 196', null, K, 5), tear: 1 },
  kaget: { b: ['M104 114 Q118 104 132 112', 'M168 112 Q182 104 196 114'], eyes: 'big', m: (c) => ell(c, 150, 192, 10, 14, '#A32D2D', K, 5), open: 1 },
  datar: { b: ['M106 132 L130 132', 'M170 132 L194 132'], eyes: 'small', m: (c) => P(c, 'M136 192 L164 192', null, K, 5) },
  serius: { b: ['M104 128 L132 134', 'M168 134 L196 128'], eyes: 'small', m: (c) => P(c, 'M136 192 L164 192', null, K, 5) },
  licik: { b: ['M104 134 L130 128', 'M170 122 Q183 112 197 124'], eyes: 'lid', m: (c) => P(c, 'M128 186 Q152 202 174 180', null, K, 5), ck: 1 },
  ngakak: { b: ['M104 118 Q118 110 132 118', 'M168 118 Q182 110 196 118'], eyes: 'happy', m: (c) => { P(c, 'M118 174 Q150 228 182 174 Z', '#A32D2D', K, 5); P(c, 'M136 204 Q150 196 164 204 Q150 214 136 204Z', '#F09595'); }, ck: 1, open: 1 },
  salting: { b: ['M104 120 Q118 112 132 120', 'M168 120 Q182 112 196 120'], eyes: 'shine', m: (c) => P(c, 'M134 192 Q142 184 150 192 Q158 200 166 192', null, K, 5), ck: 2 },
  panik: { b: ['M104 132 L130 120', 'M196 132 L170 120'], eyes: 'tiny', m: (c) => P(c, 'M124 194 Q131 186 138 194 Q145 202 152 194 Q159 186 166 194 Q173 202 178 194', null, K, 5) },
  nangis: { b: ['M104 134 L130 122', 'M196 134 L170 122'], eyes: 'squeeze', m: (c) => P(c, 'M124 202 Q150 168 176 202 Z', '#A32D2D', K, 5), open: 1 },
  cool: { b: ['M106 130 L130 130', 'M170 130 L194 130'], eyes: 'lid', m: (c) => P(c, 'M134 190 Q150 198 166 188', null, K, 5), ck: 1 },
};

function drawEyes(c, type, blink) {
  c.save();
  if (blink) { c.translate(0, 150); c.scale(1, 0.12); c.translate(0, -150); }
  if (type === 'dot') { circ(c, 118, 150, 10, K); circ(c, 182, 150, 10, K); circ(c, 121, 146, 3.4, '#fff'); circ(c, 185, 146, 3.4, '#fff'); }
  else if (type === 'dot8') { circ(c, 120, 153, 8.5, K); circ(c, 180, 153, 8.5, K); }
  else if (type === 'small') { circ(c, 120, 152, 7, K); circ(c, 180, 152, 7, K); }
  else if (type === 'big') { for (const x of [118, 182]) { circ(c, x, 148, 15, '#fff', K, 4); circ(c, x, 148, 5.5, K); } }
  else if (type === 'tiny') { for (const x of [118, 182]) { circ(c, x, 150, 14, '#fff', K, 4); circ(c, x, 150, 3, K); } }
  else if (type === 'lid') { for (const x of [119, 181]) { ell(c, x, 154, 10, 5.5, K); P(c, `M${x - 13} 149 L${x + 13} 149`, null, K, 4); } }
  else if (type === 'happy') { P(c, 'M106 156 Q118 140 130 156', null, K, 6); P(c, 'M170 156 Q182 140 194 156', null, K, 6); }
  else if (type === 'shine') { for (const x of [118, 182]) { circ(c, x, 150, 13, K); circ(c, x + 4, 145, 4.5, '#fff'); circ(c, x - 4, 155, 2.5, '#fff'); } }
  else if (type === 'squeeze') { P(c, 'M106 144 L128 152 L106 160', null, K, 6); P(c, 'M194 144 L172 152 L194 160', null, K, 6); }
  c.restore();
}

function lerpPose(a, b, k) { return a.map((arm, i) => arm.map((v, j) => lerp(v, b[i][j], k))); }

// st: {id,x,y,s,expr,pose,prevPose,poseK,talk,t,lt,anim,fx,circ,crack,alpha,rot,dy,sx,sy}
function drawChar(ctx, st) {
  const C = CH[st.id];
  ctx.save();
  ctx.translate(st.x, st.y);
  // shadow
  ctx.save(); ctx.scale(st.s, st.s);
  ell(ctx, 0, 10, 80 * (1 - Math.min(0.4, -st.dy / 200)), 9, 'rgba(90,50,40,0.18)'); ctx.restore();
  ctx.translate(st.dx || 0, st.dy || 0);
  ctx.rotate(st.rot || 0);
  ctx.scale(st.s * (st.sx || 1), st.s * (st.sy || 1));
  ctx.translate(-150, -262);
  const ex = EX[st.expr] || EX.senang;
  let pose = POSES[st.pose] || POSES.idle;
  if (st.prevPose && st.poseK < 1) pose = lerpPose(POSES[st.prevPose] || POSES.idle, pose, ease(st.poseK));
  pose = pose.map((a) => a.slice());
  if (st.pose === 'face') { const o = Math.sin(st.t * 22) * 10; pose[0][4] += o; pose[0][5] += Math.cos(st.t * 22) * 6; pose[1][4] -= o; pose[1][5] += Math.sin(st.t * 22) * 6; }
  if (st.pose === 'wave') { pose[1][4] += Math.sin(st.t * 12) * 14; }
  if (st.pose === 'pointL' && st.anim === 'poke') { const k = Math.abs(Math.sin(st.lt * Math.PI / 0.7)); pose[0][4] -= k * 14; }
  if (st.pose === 'nails') { pose[1][5] += Math.sin(st.t * 10) * 3; }
  const front = FRONT[st.pose];
  const drawArms = () => {
    for (const a of pose) {
      P(ctx, `M${a[0]} ${a[1]} Q${a[2]} ${a[3]} ${a[4]} ${a[5]}`, null, K, 5);
      circ(ctx, a[4], a[5], 8, C.skin, K, 4);
    }
    if (st.pose === 'phone') { ctx.save(); ctx.translate(214, 196); ctx.rotate(-0.25);
      ctx.fillStyle = K; ctx.beginPath(); ctx.roundRect(-16, -28, 32, 54, 6); ctx.fill();
      ctx.fillStyle = '#B5D4F4'; ctx.beginPath(); ctx.roundRect(-12, -23, 24, 42, 3); ctx.fill(); ctx.restore();
      circ(ctx, pose[1][4], pose[1][5], 8, C.skin, K, 4); }
  };
  if (!front) drawArms();
  for (const fx of [118, 182]) ell(ctx, fx, 262, 18, 9, C.skin, K, 4);
  C.body(ctx, st);
  // red circles (sesame gag)
  if (st.circ) {
    for (let i = 0; i < st.circ; i++) {
      const s = ONDE_SESAME[CIRC_ORDER[i]]; const k = clamp(st.circFrac[i], 0, 1); if (k <= 0) continue;
      ctx.save(); ctx.translate(s[0], s[1]); ctx.scale(easeOutBack(k), easeOutBack(k));
      circ(ctx, 0, 0, 13, null, '#E24B4A', 4); ctx.restore();
    }
  }
  if (C.acc) C.acc(ctx);
  if (ex.ck) { const big = ex.ck === 2; ell(ctx, 95, 185, big ? 20 : 14, big ? 11 : 8, big ? 'rgba(240,120,140,0.75)' : 'rgba(240,149,149,0.6)'); ell(ctx, 205, 185, big ? 20 : 14, big ? 11 : 8, big ? 'rgba(240,120,140,0.75)' : 'rgba(240,149,149,0.6)');
    if (big) { P(ctx, 'M84 186 l6 -8 M95 188 l6 -8 M106 186 l6 -8 M194 186 l6 -8 M205 188 l6 -8 M216 186 l6 -8', null, '#D4537E', 3); } }
  ctx.strokeStyle = K; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (const b of ex.b) P(ctx, b, null, K, 5);
  const blink = st.blink && ['dot', 'dot8', 'small', 'shine'].includes(ex.eyes);
  drawEyes(ctx, ex.eyes, blink);
  if (C.lash && !['happy', 'squeeze'].includes(ex.eyes)) C.lash(ctx);
  if (st.talk && !ex.open) { const r = 4 + 10 * Math.abs(Math.sin(st.t * 15)); ell(ctx, 150, 190, 13, r, '#A32D2D', K, 5); }
  else ex.m(ctx);
  if (ex.tear) { const k = (st.t * 0.8) % 1; P(ctx, `M112 ${164 + k * 20} q-5 11 0 15 q5 -4 0 -15`, '#85B7EB'); }
  if (front) drawArms();
  // fx in local coords
  const F = st.fx || [];
  if (F.includes('tears')) {
    for (const x of [112, 188]) { ctx.fillStyle = 'rgba(133,183,235,0.85)'; ctx.beginPath(); ctx.roundRect(x - 7, 156, 14, 90, 7); ctx.fill(); }
    for (let i = 0; i < 6; i++) { const k = (st.t * 1.6 + i / 6) % 1; const side = i % 2 ? 1 : -1; const x = 150 + side * (40 + k * 90); const y = 160 + k * 40 - Math.sin(k * Math.PI) * 50; ell(ctx, x, y, 6, 8, '#85B7EB'); }
  }
  if (F.includes('sweat')) { const k = (st.t * 1.3) % 1; P(ctx, `M236 ${100 + k * 30} q-9 16 0 22 q9 -6 0 -22`, '#85B7EB', K, 3); P(ctx, `M64 ${118 + ((k + 0.5) % 1) * 30} q-7 12 0 17 q7 -5 0 -17`, '#85B7EB', K, 3); }
  if (F.includes('anger')) { const p = 1 + 0.15 * Math.sin(st.t * 20); ctx.save(); ctx.translate(230, 92); ctx.scale(p, p);
    P(ctx, 'M-14 -4 Q-4 -4 -4 -14 M4 -14 Q4 -4 14 -4 M14 4 Q4 4 4 14 M-4 14 Q-4 4 -14 4', null, '#E24B4A', 6); ctx.restore(); }
  if (st.crack > 0) {
    const segs = ['M150 70 L140 110 L160 140 L135 175 L155 210 L145 258', 'M140 110 L95 120 L60 140', 'M160 140 L205 150 L248 140', 'M135 175 L90 200 L70 225', 'M155 210 L200 225 L225 240', 'M160 140 L180 100 L190 74'];
    const n = st.crack * segs.length;
    ctx.save(); ctx.lineWidth = 4; ctx.strokeStyle = K;
    for (let i = 0; i < segs.length; i++) { const k = clamp(n - i, 0, 1); if (k <= 0) continue; ctx.setLineDash([400 * k, 400]); P(ctx, segs[i], null, K, 4); }
    ctx.setLineDash([]); ctx.restore();
  }
  ctx.restore();
}

// body anim
function animOf(st, anim, lt, t, dur) {
  st.dx = 0; st.dy = 0; st.sx = 1; st.sy = 1; st.rot = 0;
  if (anim === 'idle' || anim === 'poke') { const b = Math.sin(t * 4); st.dy = -6 * Math.max(0, b); st.sx = 1 + 0.02 * b; st.sy = 1 - 0.02 * b; }
  else if (anim === 'shake') { st.dx = Math.sin(t * 60) * 5; st.rot = Math.sin(t * 45) * 0.02; }
  else if (anim === 'jump') { const k = clamp(lt / 0.55, 0, 1); if (k < 0.15) { st.sy = 1 - 0.2 * (k / 0.15); st.sx = 1 + 0.15 * (k / 0.15); } else { const j = (k - 0.15) / 0.85; st.dy = -90 * Math.sin(j * Math.PI); st.sy = 1 + 0.12 * Math.sin(j * Math.PI); st.sx = 1 - 0.08 * Math.sin(j * Math.PI); }
    if (k >= 1) animOf(st, 'idle', lt, t, dur); }
  else if (anim === 'roll') { st.rot = Math.sin(t * 9) * 0.28; st.dy = -Math.abs(Math.sin(t * 9)) * 30; st.dx = Math.sin(t * 4.5) * 10; }
  else if (anim === 'droop') { const b = Math.sin(t * 2); st.sy = 0.95 + 0.02 * b; st.sx = 1.04 - 0.02 * b; }
  else if (anim === 'sob') { const b = Math.abs(Math.sin(t * 8)); st.sy = 1 - 0.05 * b; st.sx = 1 + 0.04 * b; st.dx = Math.sin(t * 30) * 2; }
  else if (anim === 'hop') { const b = Math.abs(Math.sin(t * 9)); st.dy = -45 * b; st.sy = 1 + 0.06 * b; st.sx = 1 - 0.04 * b; st.rot = Math.sin(t * 9) * 0.08; }
  else if (anim === 'walk') { const b = Math.abs(Math.sin(t * 5)); st.dy = -14 * b; st.rot = Math.sin(t * 5) * 0.06; }
}

function charState(id, t, bi) {
  const b = BEATS[bi], cfg = b[id];
  if (!cfg || cfg.vis === 0) return null;
  const lt = t - b.t0;
  const prevB = BEATS[bi - 1], prev = prevB && prevB[id];
  const st = { id, s: 1.55, y: 1290, expr: cfg.expr, pose: cfg.pose || 'idle', t, lt, fx: cfg.fx || [] };
  let x = cfg.x;
  if (cfg.enter) { const k = easeOutBack(lt / 0.45); x = lerp(1300, cfg.x, k); }
  else if (cfg.move) { x = lerp(prev ? prev.x : cfg.x, cfg.x, clamp(lt / cfg.move, 0, 1)); }
  else if (prev && prev.vis !== 0 && prev.x !== cfg.x && !b.cam?.cut) { x = lerp(prev.x, cfg.x, ease(lt / 0.4)); }
  st.x = x;
  if (prev && prev.vis !== 0 && prev.pose && prev.pose !== st.pose) { st.prevPose = prev.pose; st.poseK = lt / 0.18; }
  const tl = b.slowmo ? t * 0.45 : t;
  animOf(st, cfg.anim || 'idle', lt, tl, b.dur);
  st.talk = b.who === id && lt > 0.08 && lt < b.dur - 0.25 && !(b.talkSkip && lt < b.talkSkip) && b.text !== '...';
  st.blink = ((t + (id === 'onde' ? 1.3 : 0)) % 3.1) < 0.13;
  if (cfg.circ) { const [a, c2] = cfg.circ; const n = c2; st.circ = n; st.circFrac = [];
    for (let i = 0; i < n; i++) { if (i < a) st.circFrac.push(1); else { const start = a === 0 ? [0.2, 0.9, 1.6][i] ?? 0 : 0.1 + (i - a) * 0.17; st.circFrac.push((lt - start) / 0.2); } } }
  if (cfg.crack) { const [c0, c1] = cfg.crack; st.crack = c0 === c1 ? c1 : clamp(lerp(c0, c1, (lt - 0.3) / 1.2), 0, 1); }
  if (b.big) st.s = 1.75; if (id === 'klepon') st.s = b.big ? 1.55 : 1.35;
  return st;
}

// ---------- background ----------
function drawRoom(ctx) {
  ctx.fillStyle = '#FBE3E8'; ctx.fillRect(-600, -400, 2300, 1700);
  ctx.fillStyle = '#F7D5DD'; for (let x = -600; x < 1700; x += 90) ctx.fillRect(x, -400, 36, 1700);
  // window
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(640, 360, 330, 380, 20); ctx.fill();
  ctx.fillStyle = '#BFE3F7'; ctx.beginPath(); ctx.roundRect(662, 382, 286, 336, 12); ctx.fill();
  circ(ctx, 880, 450, 34, '#FFE7A0'); ell(ctx, 720, 520, 46, 18, '#FFFFFF'); ell(ctx, 760, 508, 34, 20, '#FFFFFF');
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(802, 382, 8, 336); ctx.fillRect(662, 546, 286, 8);
  ctx.fillStyle = '#F4A9BE'; P(ctx, 'M620 340 L700 340 Q660 560 690 760 L620 760Z', '#F4A9BE'); P(ctx, 'M990 340 L910 340 Q950 560 920 760 L990 760Z', '#F4A9BE');
  ctx.fillStyle = '#E58BA5'; ctx.fillRect(600, 326, 410, 18);
  // frames left
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(110, 420, 190, 230, 14); ctx.fill();
  ctx.fillStyle = '#FFE1A8'; ctx.beginPath(); ctx.roundRect(126, 436, 158, 198, 8); ctx.fill();
  P(ctx, 'M205 590 C140 545 150 490 185 495 C198 497 205 510 205 510 C205 510 212 497 225 495 C260 490 270 545 205 590Z', '#F09595');
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(330, 470, 150, 150, 14); ctx.fill();
  ctx.fillStyle = '#CDE8C5'; ctx.beginPath(); ctx.roundRect(344, 484, 122, 122, 8); ctx.fill();
  P(ctx, 'M405 500 L420 535 L458 538 L428 560 L438 596 L405 575 L372 596 L382 560 L352 538 L390 535Z', '#FFFFFF');
  // fairy lights
  ctx.strokeStyle = '#B98F7A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-100, 250); for (let x = -100; x <= 1200; x += 20) ctx.lineTo(x, 250 + 40 * Math.sin((x + 100) / 1300 * Math.PI * 3) ** 2); ctx.stroke();
  for (let x = -60, i = 0; x <= 1180; x += 90, i++) { const y = 254 + 40 * Math.sin((x + 100) / 1300 * Math.PI * 3) ** 2; circ(ctx, x, y + 8, 10, ['#FFD36E', '#F4A9BE', '#A8DDF0', '#C9F0B0'][i % 4]); }
  // floor
  ctx.fillStyle = '#E8C39E'; ctx.fillRect(-600, 1150, 2300, 1300);
  ctx.strokeStyle = '#D9AE84'; ctx.lineWidth = 4;
  for (let y = 1220; y < 2400; y += 90) { ctx.beginPath(); ctx.moveTo(-600, y); ctx.lineTo(1700, y); ctx.stroke(); }
  for (let y = 1150, r = 0; y < 2400; y += 90, r++) for (let x = -600 + (r % 2) * 150; x < 1700; x += 300) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 90); ctx.stroke(); }
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-600, 1132, 2300, 22);
  // rug
  ell(ctx, 540, 1300, 470, 85, '#F6C3CF'); ell(ctx, 540, 1300, 430, 70, null, '#FFFFFF', 4);
  // plant right
  ctx.fillStyle = '#C98B6B'; P(ctx, 'M960 1150 L1050 1150 L1035 1250 L975 1250Z', '#E9A27D', K, 0.01);
  for (const [a, l] of [[-0.6, 110], [-0.2, 140], [0.25, 125], [0.6, 95]]) { ctx.save(); ctx.translate(1005, 1150); ctx.rotate(a); ell(ctx, 0, -l / 2, 22, l / 2, '#7DBE5A'); ctx.restore(); }
}

// ---------- overlays ----------
function wrap(ctx, text, maxW) {
  const words = text.split(' '); const lines = []; let cur = '';
  for (const w of words) { const tt = cur ? cur + ' ' + w : w; if (ctx.measureText(tt).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tt; }
  if (cur) lines.push(cur); return lines;
}
function subtitle(ctx, b, lt) {
  if (!b.text) return;
  const k = clamp(lt / 0.15, 0, 1);
  const name = b.who === 'onde' ? 'ONDE' : 'BAKPI';
  const col = b.who === 'onde' ? '#D4537E' : '#8A5A2B';
  ctx.save();
  ctx.globalAlpha = k;
  ctx.translate(540, 1520 + (1 - k) * 20);
  ctx.font = `800 64px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.wordSpacing = '12px';
  const lines = wrap(ctx, b.text, 900);
  const lh = 80; const top = -((lines.length - 1) * lh) / 2;
  // name pill
  ctx.font = `800 36px ${FONT}`; const nw = ctx.measureText(name).width + 44;
  ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-nw / 2, top - 100, nw, 54, 27); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.fillText(name, 0, top - 72);
  ctx.font = `800 64px ${FONT}`;
  lines.forEach((ln, i) => { const y = top + i * lh; ctx.lineWidth = 14; ctx.strokeStyle = '#1E1E1E'; ctx.lineJoin = 'round'; ctx.strokeText(ln, 0, y); ctx.fillStyle = '#FFFFFF'; ctx.fillText(ln, 0, y); });
  ctx.restore();
}
function hookText(ctx, lines, lt) {
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.wordSpacing = '8px';
  const k = easeOutBack(lt / 0.3);
  ctx.translate(540, 330); ctx.scale(k, k);
  ctx.font = `800 58px ${FONT}`;
  const lh = 82, w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 70, h = lines.length * lh + 40;
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 26); ctx.fill();
  ctx.fillStyle = '#1E1E1E'; lines.forEach((l, i) => ctx.fillText(l, 0, -h / 2 + 20 + lh / 2 + i * lh + 4));
  ctx.restore();
}
function sparkles(ctx, cx, cy, t, r, n) {
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + t * 0.6; const k = (t * 1.2 + rnd(i)) % 1; const s = Math.sin(k * Math.PI) * 18 + 4;
    const x = cx + Math.cos(a) * r * (0.8 + 0.3 * rnd(i + 9)), y = cy + Math.sin(a) * r * 0.8;
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = ['#FFD36E', '#FFFFFF', '#F4A9BE'][i % 3];
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(0, 0, s, 0); ctx.quadraticCurveTo(0, 0, 0, s); ctx.quadraticCurveTo(0, 0, -s, 0); ctx.quadraticCurveTo(0, 0, 0, -s); ctx.fill(); ctx.restore();
  }
}
function floatEmoji(ctx, ch, cx, cy, t, n, size) {
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${size}px ${FONT}`;
  for (let i = 0; i < n; i++) { const k = (t * 0.7 + i / n) % 1; ctx.globalAlpha = Math.sin(k * Math.PI);
    ctx.fillText(ch, cx + (rnd(i) - 0.5) * 360 + Math.sin(t * 3 + i) * 20, cy - k * 360); }
  ctx.restore();
}
function hearts(ctx, cx, cy, t) {
  for (let i = 0; i < 6; i++) { const k = (t * 0.8 + i / 6) % 1; const x = cx + (rnd(i + 3) - 0.5) * 380 + Math.sin(t * 4 + i) * 16, y = cy - k * 320; const s = 1.4 * Math.sin(k * Math.PI);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = Math.sin(k * Math.PI);
    P(ctx, 'M0 14 C-22 0 -16 -18 -6 -16 C-2 -15 0 -10 0 -10 C0 -10 2 -15 6 -16 C16 -18 22 0 0 14Z', '#E8607F'); ctx.restore(); }
}
function spinner(ctx, t, label) {
  label = typeof label === 'string' ? label : 'otak lagi loading...';
  ctx.save(); ctx.translate(540, 520);
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.roundRect(-110, -110, 220, 220, 30); ctx.fill();
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const on = (Math.floor(t * 12) - i + 120) % 12; ctx.strokeStyle = `rgba(255,255,255,${1 - on / 12})`; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * 35, Math.sin(a) * 35); ctx.lineTo(Math.cos(a) * 65, Math.sin(a) * 65); ctx.stroke(); }
  ctx.restore();
  ctx.save(); ctx.font = `800 44px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#1E1E1E'; ctx.lineWidth = 10; ctx.lineJoin = 'round';
  ctx.strokeText(label, 540, 690); ctx.fillText(label, 540, 690); ctx.restore();
}
function mirrorFrame(ctx) {
  ctx.save(); ctx.fillStyle = '#F2E6D8';
  const p = new Path2D(); p.rect(0, 0, W, H); p.ellipse(540, 900, 470, 640, 0, 0, Math.PI * 2);
  ctx.fill(p, 'evenodd');
  ctx.strokeStyle = '#C9A15A'; ctx.lineWidth = 40; ctx.beginPath(); ctx.ellipse(540, 900, 470, 640, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#A57F3C'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(540, 900, 492, 662, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(250, 600); ctx.lineTo(380, 420); ctx.stroke(); ctx.beginPath(); ctx.moveTo(260, 690); ctx.lineTo(330, 590); ctx.stroke();
  ctx.restore();
}
function drawHead(ctx, id, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.translate(-150, -160);
  CH[id].body(ctx, {}); CH[id].acc(ctx); const ex = EX.cool; for (const b of ex.b) P(ctx, b, null, K, 5); drawEyes(ctx, 'lid'); ex.m(ctx);
  ell(ctx, 95, 185, 14, 8, 'rgba(240,149,149,0.6)'); ell(ctx, 205, 185, 14, 8, 'rgba(240,149,149,0.6)');
  ctx.restore();
}
// Chat screen. Content comes from script.phone (see docs/script-format.md); stage is "typing" or "reply".
const PHONE_DEFAULT = { contact: { id: 'klepon', name: 'Mbak Klepon 🌿', status: 'aktif 1 menit lalu' },
  earlierLabel: '3 minggu lalu', earlier: [{ me: true, text: 'hai mbak klepon 🥺👉👈' }, { me: true, text: 'udah makan belum?' }, { me: true, text: 'p' }],
  readLabel: 'Dibaca', todayLabel: 'Hari ini', reply: 'siapa ya?' };
function phoneOverlay(ctx, stage, lt) {
  const ph = Object.assign({}, PHONE_DEFAULT, (SCRIPT && SCRIPT.phone) || {});
  const k = stage === 'typing' ? easeOutBack(lt / 0.4) : 1;
  ctx.save(); ctx.translate(540, 820 + (1 - k) * 1100); ctx.rotate(-0.03);
  const w = 600, h = 920;
  ctx.fillStyle = '#1E1E1E'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 60); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(-w / 2 + 22, -h / 2 + 22, w - 44, h - 44, 42); ctx.fill();
  ctx.fillStyle = '#1E1E1E'; ctx.beginPath(); ctx.roundRect(-70, -h / 2 + 34, 140, 30, 15); ctx.fill();
  ctx.fillStyle = '#F3F1EC'; ctx.fillRect(-w / 2 + 22, -h / 2 + 80, w - 44, 120);
  ctx.save(); ctx.beginPath(); ctx.arc(-w / 2 + 92, -h / 2 + 140, 42, 0, Math.PI * 2); ctx.fillStyle = '#E7F4DF'; ctx.fill(); ctx.clip();
  drawHead(ctx, (ph.contact && ph.contact.id) || 'klepon', -w / 2 + 92, -h / 2 + 152, 0.36); ctx.restore();
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#1E1E1E'; ctx.font = `800 38px ${FONT}`; ctx.fillText(ph.contact.name || '', -w / 2 + 150, -h / 2 + 124);
  ctx.font = `600 26px ${FONT}`; ctx.fillStyle = '#8A8A85'; ctx.fillText(ph.contact.status || '', -w / 2 + 150, -h / 2 + 164);
  ctx.textAlign = 'center'; ctx.font = `600 24px ${FONT}`; ctx.fillStyle = '#9A9A94'; if (ph.earlierLabel) ctx.fillText(ph.earlierLabel, 0, -h / 2 + 250);
  const bub = (x, y, txt, out) => { ctx.font = `600 34px ${FONT}`; const tw = Math.min(w - 120, ctx.measureText(txt).width + 50); const bx = out ? x - tw : x;
    ctx.fillStyle = out ? '#378ADD' : '#ECEAE4'; ctx.beginPath(); ctx.roundRect(bx, y, tw, 70, 30); ctx.fill();
    ctx.fillStyle = out ? '#FFFFFF' : '#1E1E1E'; ctx.textAlign = 'left'; ctx.fillText(txt, bx + 25, y + 37, tw - 50); };
  let y = -h / 2 + 285;
  for (const m of (ph.earlier || []).slice(0, 4)) { bub(m.me ? w / 2 - 50 : -w / 2 + 50, y, m.text, m.me); y += 85; }
  ctx.font = `600 22px ${FONT}`; ctx.fillStyle = '#9A9A94'; ctx.textAlign = 'right'; if (ph.readLabel) ctx.fillText(ph.readLabel, w / 2 - 54, y + 8);
  ctx.textAlign = 'center'; ctx.font = `600 24px ${FONT}`; if (ph.todayLabel) ctx.fillText(ph.todayLabel, 0, y + 60);
  const ry = y + 100;
  if (stage === 'typing') { ctx.fillStyle = '#ECEAE4'; ctx.beginPath(); ctx.roundRect(-w / 2 + 50, ry, 130, 70, 30); ctx.fill();
    for (let i = 0; i < 3; i++) circ(ctx, -w / 2 + 85 + i * 30, ry + 35 - Math.max(0, Math.sin(lt * 9 - i)) * 8, 8, '#9A9A94'); }
  else { const s = easeOutBack(lt / 0.3); ctx.save(); ctx.translate(-w / 2 + 50, ry); ctx.scale(s, s); bub(0, 0, ph.reply, false); ctx.restore(); }
  ctx.restore();
}
function outroCard(ctx, lt) {
  const k1 = easeOutBack((lt - 0.2) / 0.35), k2 = easeOutBack((lt - 1.2) / 0.35);
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const box = (y, lines, k, bg, fg) => { if (k <= 0) return; ctx.save(); ctx.translate(540, y); ctx.scale(k, k); ctx.font = `800 60px ${FONT}`; ctx.wordSpacing = '8px';
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 80, h = lines.length * 80 + 40;
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 26); ctx.fill(); ctx.fillStyle = fg;
    lines.forEach((l, i) => ctx.fillText(l, 0, -h / 2 + 20 + 40 + i * 80 + 3)); ctx.restore(); };
  const oc = Object.assign({ top: ['tag bestie yang mulutnya', 'gak ada filter 👇'], bottom: ['gak ada yang menang di sini,', 'cuma ada korban 😭'] }, (SCRIPT && SCRIPT.outro) || {});
  if (oc.top && oc.top.length) box(330, oc.top, k1, '#FFFFFF', '#1E1E1E');
  if (oc.bottom && oc.bottom.length) box(1560, oc.bottom, k2, '#1E1E1E', '#FFFFFF');
  ctx.restore();
}
function shatterBakpi(ctx, st, k) {
  // render bakpi to offscreen then draw as falling shards
  const oc = shatterBakpi.oc || (shatterBakpi.oc = document.createElement('canvas'));
  oc.width = 700; oc.height = 700; const o = oc.getContext('2d'); o.clearRect(0, 0, 700, 700);
  o.save(); o.translate(350 - st.x, 600 - st.y); drawChar(o, { ...st, fx: [], dy: 0, dx: 0 }); o.restore();
  const cols = 4, rows = 4, x0 = 350 - 150 * st.s, y0 = 600 - 262 * st.s + 50 * st.s, cw = 300 * st.s / cols, rh = 230 * st.s / rows;
  const V = (i, j) => [x0 + i * cw + (i > 0 && i < cols ? (rnd(i * 7 + j) - 0.5) * cw * 0.5 : 0) + (i === 0 ? -40 : i === cols ? 40 : 0), y0 + j * rh + (j > 0 && j < rows ? (rnd(i + j * 13) - 0.5) * rh * 0.5 : 0) + (j === 0 ? -80 : j === rows ? 40 : 0)];
  ctx.save(); ctx.translate(st.x - 350, st.y - 600);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const pts = [V(i, j), V(i + 1, j), V(i + 1, j + 1), V(i, j + 1)];
    const cx = pts.reduce((a, p) => a + p[0], 0) / 4, cy = pts.reduce((a, p) => a + p[1], 0) / 4;
    const id = i * 5 + j; const delay = (rows - j) * 0.05 + rnd(id) * 0.1; const kk = Math.max(0, k - delay);
    const vx = (cx - 350) * 0.6 + (rnd(id + 1) - 0.5) * 120, vy = -260 - rnd(id + 2) * 200;
    const dx = vx * kk, dy = vy * kk + 1100 * kk * kk; const rot = (rnd(id + 3) - 0.5) * 6 * kk;
    ctx.save(); ctx.globalAlpha = clamp(1 - (kk - 0.7) * 2, 0, 1); ctx.translate(cx + dx, cy + dy); ctx.rotate(rot); ctx.translate(-cx, -cy);
    ctx.beginPath(); pts.forEach((p, n) => n ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.clip();
    ctx.drawImage(oc, 0, 0); ctx.restore();
  }
  ctx.restore();
}

// ---------- camera ----------
function camAt(t, bi) {
  const b = BEATS[bi], lt = t - b.t0;
  const tgt = b.cam || TWO;
  let prevC = TWO; for (let i = bi - 1; i >= 0; i--) { prevC = camAt(BEATS[i].t0 + BEATS[i].dur - 0.0001, i).c; break; }
  let c;
  if (tgt.cut || bi === 0) c = { z: tgt.z, cx: tgt.cx, cy: tgt.cy };
  else if (tgt.punch) { const k = easeOutBack(lt / 0.25); c = { z: lerp(prevC.z, tgt.z, k), cx: lerp(prevC.cx, tgt.cx, k), cy: lerp(prevC.cy, tgt.cy, k) }; }
  else { const k = ease(lt / (tgt.slow ? b.dur : 0.45)); c = { z: lerp(prevC.z, tgt.z, k), cx: lerp(prevC.cx, tgt.cx, k), cy: lerp(prevC.cy, tgt.cy, k) }; }
  return { c };
}
const camCache = new Map();
function cam(t, bi) { return camAt(t, bi).c; }

// ---------- main render ----------
function render(t) {
  const cv = document.getElementById('c'); const ctx = cv.getContext('2d');
  const bi = beatAt(t), b = BEATS[bi], lt = t - b.t0;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
  const c = cam(t, bi);
  let shx = 0, shy = 0;
  const shakeAmt = (b.shake || b.flash ? Math.max(0, 1 - lt / 0.5) : 0) * 22;
  shx = Math.sin(t * 80) * shakeAmt; shy = Math.cos(t * 67) * shakeAmt;
  ctx.save();
  ctx.translate(540 + shx, 960 + shy); ctx.scale(c.z, c.z); ctx.translate(-c.cx, -c.cy);
  drawRoom(ctx);
  const order = (SCRIPT && SCRIPT.drawOrder) || ["klepon", "onde", "bakpi"];
  const states = {};
  for (const id of order) { const st = charState(id, t, bi); if (st) states[id] = st; }
  for (const id of order) {
    const st = states[id]; if (!st) continue;
    if (st.fx.includes('shatter')) { const k = (lt - 1.3) / 2.6; if (k > 0) { shatterBakpi(ctx, st, k); continue; } }
    drawChar(ctx, st);
    const hx = st.x, hy = st.y - 330 * st.s / 1.55;
    if (st.fx.includes('sparkle')) sparkles(ctx, hx, hy + 100, t, 280, 9);
    if (st.fx.includes('hearts')) hearts(ctx, hx, hy, t);
    if (st.fx.includes('skulls')) floatEmoji(ctx, '💀', hx, hy, t, 5, 70);
  }
  ctx.restore();
  // screen overlays
  if (b.tint) { ctx.fillStyle = 'rgba(70,20,110,0.22)'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(540, 960, 500, 540, 960, 1200); g.addColorStop(0, 'rgba(30,0,50,0)'); g.addColorStop(1, 'rgba(30,0,50,0.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  if (b.mirror) { mirrorFrame(ctx); }
  if (b.villain) { const k = easeOutBack(lt / 0.3); ctx.save(); ctx.translate(540, 360); ctx.scale(k, k); ctx.rotate(-0.05);
    ctx.font = `800 110px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 18; ctx.strokeStyle = '#1E1E1E'; ctx.lineJoin = 'round'; ctx.strokeText(b.villain, 0, 0); ctx.fillStyle = '#E24B4A'; ctx.fillText(b.villain, 0, 0); ctx.restore(); }
  if (b.spinner) spinner(ctx, t, b.spinner);
  if (b.phone) phoneOverlay(ctx, b.phone, lt);
  if (b.slowmo) { ctx.save(); ctx.font = `800 46px ${FONT}`; ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6); ctx.fillText('▶ 0.5x', 540, 300); ctx.restore(); }
  if (b.hook) hookText(ctx, b.hook, lt);
  if (b.outro) outroCard(ctx, lt);
  subtitle(ctx, b, lt);
  if (b.flash && lt < 0.25) { ctx.fillStyle = `rgba(255,255,255,${0.85 * (1 - lt / 0.25)})`; ctx.fillRect(0, 0, W, H); }
  // fade in/out
  if (t < 0.15) { ctx.fillStyle = `rgba(0,0,0,${1 - t / 0.15})`; ctx.fillRect(0, 0, W, H); }
  if (t > TOTAL - 0.4) { ctx.fillStyle = `rgba(0,0,0,${(t - (TOTAL - 0.4)) / 0.4})`; ctx.fillRect(0, 0, W, H); }
}
// ---------- validation (used by render.js before drawing anything) ----------
const SFX_NAMES = ['pop','whoosh','boing','vineboom','ding1','ding2','ding3','dingroll','rub','sad','scratch','dramatic','laugh','grr','dun','cute','sparkle','typing','notif','cricket','crack','shatter','tada'];
const CHAR_FX = ['sparkle','sweat','circles','anger','tears','hearts','skulls','cracks','shatter'];
const ANIMS = ['idle','none','shake','jump','roll','droop','sob','hop','walk','poke'];
const MUSIC = ['happy','panic','villain','none'];
function validateScript(s) {
  const err = [];
  if (!s || !Array.isArray(s.beats) || !s.beats.length) return ['script.beats must be a non-empty array'];
  s.beats.forEach((b, i) => {
    const at = `beat ${i}`;
    if (!(b.dur > 0)) err.push(`${at}: dur must be > 0`);
    if (b.who && !CH[b.who]) err.push(`${at}: unknown speaker "${b.who}"`);
    if (b.who && !b[b.who]) err.push(`${at}: speaker "${b.who}" is not on screen in this beat`);
    if (b.text && b.dur < 0.6 + b.text.length * 0.035) err.push(`${at}: dur ${b.dur}s is too short to read "${b.text}"`);
    if (b.music && !MUSIC.includes(b.music)) err.push(`${at}: unknown music "${b.music}"`);
    for (const [off, name] of b.sfx || []) { if (!SFX_NAMES.includes(name)) err.push(`${at}: unknown sfx "${name}"`); if (off > b.dur) err.push(`${at}: sfx "${name}" starts after the beat ends`); }
    if (b.phone && !['typing', 'reply'].includes(b.phone)) err.push(`${at}: phone must be "typing" or "reply"`);
    for (const id of Object.keys(CH)) {
      const c = b[id]; if (!c || c.vis === 0) continue;
      if (typeof c.x !== 'number') err.push(`${at}.${id}: x is required`);
      if (c.expr && !EX[c.expr]) err.push(`${at}.${id}: unknown expr "${c.expr}" (use ${Object.keys(EX).join(', ')})`);
      if (c.pose && !POSES[c.pose]) err.push(`${at}.${id}: unknown pose "${c.pose}" (use ${Object.keys(POSES).join(', ')})`);
      if (c.anim && !ANIMS.includes(c.anim)) err.push(`${at}.${id}: unknown anim "${c.anim}"`);
      for (const f of c.fx || []) if (!CHAR_FX.includes(f)) err.push(`${at}.${id}: unknown fx "${f}"`);
    }
  });
  return err;
}
window.validateScript = validateScript;
window.render = render;
