const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage();
  p.on('pageerror', (e) => { console.error('PAGEERR', e.message); process.exitCode = 1; });
  await p.goto('file://' + path.join(__dirname, 'sheet.html'));
  await p.evaluate(async () => { await document.fonts.load('800 60px Pop'); await document.fonts.load('500 30px Pop'); });
  for (const f of ['lineup', 'expressions']) {
    const d = await p.evaluate((f) => window[f](), f);
    fs.writeFileSync(path.join(out, `yippi-squad-${f}.png`), Buffer.from(d.split(',')[1], 'base64'));
  }
  await b.close();
})();
