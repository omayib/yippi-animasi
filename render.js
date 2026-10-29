#!/usr/bin/env node
// Render a yippi-animasi script into a TikTok-ready MP4 + cover image.
//
//   node render.js scripts/wijen-gate.json            video + thumbnail + caption
//   node render.js scripts/wijen-gate.json --voice    add gibberish cartoon voices
//   node render.js scripts/wijen-gate.json --thumb    thumbnail only
//   node render.js scripts/wijen-gate.json --stills 3,12.5,40   preview frames as JPEG
//
// Output goes to out/<slug>/ (override with --out DIR).
const path = require('path');
const fs = require('fs');
const { spawn, spawnSync } = require('child_process');

function loadPlaywright() {
  for (const p of ['playwright', 'playwright-core', '/opt/npm-tools/node_modules/playwright']) {
    try { return require(p); } catch (e) { /* try next */ }
  }
  console.error('Playwright not found. Run: npm install && npx playwright install chromium');
  process.exit(1);
}

const args = process.argv.slice(2);
const scriptPath = args.find((a) => a.endsWith('.json'));
if (!scriptPath) { console.error('Usage: node render.js scripts/<name>.json [--voice] [--thumb] [--stills t1,t2] [--out DIR]'); process.exit(1); }
const flag = (f) => args.includes(f);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };

const script = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
const slug = script.slug || path.basename(scriptPath, '.json');
const outDir = path.resolve(opt('--out') || path.join(__dirname, 'out', slug));
const work = path.join(outDir, '.work');
fs.mkdirSync(work, { recursive: true });
const FPS = 30;

function run(cmd, argv) {
  const r = spawnSync(cmd, argv, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`${cmd} exited with ${r.status}`);
}

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => { console.error('PAGE ERROR:', e.message); process.exitCode = 1; });
  await page.goto('file://' + path.join(__dirname, 'engine', 'index.html'));
  await page.evaluate(async () => {
    await document.fonts.load('800 60px Pop'); await document.fonts.load('500 30px Pop');
    await document.fonts.load('60px "Noto Color Emoji"'); await document.fonts.ready;
  });
  const problems = await page.evaluate((s) => validateScript(s), script);
  if (problems.length) { console.error('Script problems:\n - ' + problems.join('\n - ')); await browser.close(); process.exit(2); }
  const info = await page.evaluate((s) => loadScript(s), script);
  console.log(`${script.title || slug}: ${info.beats} beats, ${info.total.toFixed(1)} s`);

  const grab = async (t, type = 'jpeg') => {
    const d = await page.evaluate(([t, type]) => {
      if (t === null) renderThumb(); else render(t);
      return document.getElementById('c').toDataURL(type === 'png' ? 'image/png' : 'image/jpeg', 0.92);
    }, [t, type]);
    return Buffer.from(d.split(',')[1], 'base64');
  };

  // thumbnail is cheap, always make it
  if (script.thumbnail) {
    fs.writeFileSync(path.join(outDir, `${slug}-thumbnail.png`), await grab(null, 'png'));
    console.log('thumbnail ok');
  }
  if (script.caption) fs.writeFileSync(path.join(outDir, `${slug}-caption.txt`), script.caption + '\n');

  if (opt('--stills')) {
    for (const t of opt('--stills').split(',').map(Number)) {
      fs.writeFileSync(path.join(outDir, `still-${t}.jpg`), await grab(t));
    }
    console.log('stills written to', outDir);
  } else if (!flag('--thumb')) {
    // one encoded file per scene, then concat without re-encoding
    const beats = await page.evaluate(() => BEATS.map((b) => ({ scene: b.scene, t0: b.t0, dur: b.dur })));
    const scenes = [];
    for (const b of beats) {
      const last = scenes[scenes.length - 1];
      if (last && last.name === b.scene) last.end = b.t0 + b.dur;
      else scenes.push({ name: b.scene || `s${scenes.length}`, end: b.t0 + b.dur });
    }
    let frame = 0; const list = [];
    for (const [i, s] of scenes.entries()) {
      const fin = path.join(work, `s${String(i).padStart(2, '0')}_${s.name}.mp4`);
      const tmp = fin.replace(/\.mp4$/, '.tmp.mp4');
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', String(FPS), tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
      const done = new Promise((r) => ff.on('exit', r));
      const endF = Math.round(s.end * FPS);
      for (; frame < endF; frame++) {
        if (!ff.stdin.write(await grab(frame / FPS))) await new Promise((r) => ff.stdin.once('drain', r));
      }
      ff.stdin.end();
      if ((await done) !== 0) throw new Error('ffmpeg failed on scene ' + s.name);
      fs.renameSync(tmp, fin); list.push(`file '${fin}'`);
      console.log(`scene ${s.name} ok (${frame} frames)`);
    }
    fs.writeFileSync(path.join(work, 'list.txt'), list.join('\n') + '\n');
    const video = path.join(work, 'video.mp4');
    run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(work, 'list.txt'), '-c', 'copy', video]);
    const wav = path.join(work, 'audio.wav');
    run('python3', [path.join(__dirname, 'audio', 'audio.py'), path.resolve(scriptPath), wav, ...(flag('--voice') ? ['--voice'] : [])]);
    const final = path.join(outDir, `${slug}${flag('--voice') ? '-voice' : ''}.mp4`);
    run('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', final + '.tmp.mp4']);
    fs.renameSync(final + '.tmp.mp4', final);
    console.log('video ok:', final);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
