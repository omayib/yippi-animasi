"""Animal-Crossing-style gibberish voices for Bakpi (low) and Onde (high)."""
import re, numpy as np
from scipy.signal import lfilter, butter

SR = 44100
rng = np.random.default_rng(11)
VOWELS = {'a': (800, 1250), 'i': (300, 2300), 'u': (330, 900), 'e': (480, 1900), 'o': (520, 950)}
VOICE = {
    'bakpi': dict(f0=165, speed=1.0, bright=0.55, form=0.92),
    'onde': dict(f0=305, speed=1.12, bright=0.75, form=1.12),
}
EMO = {  # pitch mult, contour (start->end mult), jitter, loudness, roughness, syl len mult
    'senang': (1.08, (1.0, 1.08), 0.06, 1.0, 0.0, 1.0),
    'licik': (0.98, (1.12, 0.9), 0.10, 0.9, 0.0, 1.15),
    'kaget': (1.30, (1.0, 1.25), 0.10, 1.25, 0.0, 0.85),
    'panik': (1.28, (1.05, 1.2), 0.18, 1.2, 0.0, 0.75),
    'marah': (0.88, (1.05, 0.92), 0.06, 1.3, 0.55, 0.95),
    'serius': (0.92, (1.0, 0.94), 0.03, 1.0, 0.1, 1.05),
    'datar': (0.95, (1.0, 0.97), 0.01, 0.85, 0.0, 1.1),
    'nangis': (1.15, (1.1, 0.85), 0.12, 1.15, 0.2, 1.3),
    'sedih': (0.9, (1.0, 0.8), 0.04, 0.8, 0.0, 1.35),
    'ngakak': (1.15, (1.0, 1.1), 0.25, 1.15, 0.0, 0.9),
    'salting': (1.35, (1.0, 1.2), 0.14, 1.15, 0.0, 0.85),
}

def syllables(text):
    t = re.sub(r'[^a-zA-Z\s\-.,?!]', '', text).lower()
    words = re.findall(r"[a-z]+|[.,?!]", t)
    out = []
    for w in words:
        if w in '.,?!':
            if out: out[-1]['punct'] = w
            continue
        groups = re.findall(r'[aiueo]+', w) or ['a']
        for g in groups: out.append({'v': g[0], 'punct': None})
    return out

def resonator(x, f, bw):
    r = np.exp(-np.pi * bw / SR); th = 2 * np.pi * f / SR
    return lfilter([1 - r], [1, -2 * r * np.cos(th), r * r], x)

def syl_sound(f0a, f0b, dur, vowel, v, rough, loud):
    n = int(dur * SR); t = np.arange(n) / SR
    f0 = np.linspace(f0a, f0b, n) * (1 + 0.015 * np.sin(2 * np.pi * 6 * t))
    ph = np.cumsum(f0) / SR
    src = (2 * (ph % 1) - 1) * v['bright'] + np.where(ph % 1 < 0.5, 1.0, -1.0) * (1 - v['bright']) * 0.6
    if rough: src = np.tanh(src * (1 + 3 * rough)) + rough * 0.25 * rng.uniform(-1, 1, n)
    F1, F2 = VOWELS.get(vowel, VOWELS['a'])
    y = resonator(src, F1 * v['form'], 120) * 1.0 + resonator(src, F2 * v['form'], 180) * 0.7 + src * 0.08
    att = min(n, int(0.008 * SR)); rel = min(n, int(0.035 * SR))
    e = np.ones(n); e[:att] = np.linspace(0, 1, att); e[-rel:] *= np.linspace(1, 0, rel)
    y = y * e
    return y / (np.abs(y).max() + 1e-9) * 0.5 * loud

def render_voice(beats, N):
    out = np.zeros(N); active = np.zeros(N)
    for b in beats:
        who = b.get('who'); text = b.get('text')
        if not who or not text or text.strip('. ') == '': continue
        v = VOICE[who]; pm, (ca, cb), jit, loud, rough, slm = EMO.get(b.get('expr'), EMO['senang'])
        if text.upper() == text and re.search('[A-Z]', text): loud *= 1.15; pm *= 1.06
        sy = syllables(text)
        if not sy: continue
        start = b['t0'] + 0.08 + b.get('talkSkip', 0); end = b['t0'] + b['dur'] - 0.25
        if text.startswith('...'): start += 0.35
        win = end - start
        # timing: base syllable 0.11s scaled, pauses for punctuation
        base = 0.105 * slm / v['speed']
        units = [base + (0.16 if s['punct'] else 0) for s in sy]
        scale = min(1.0, win / sum(units)); t = start
        nsy = len(sy)
        for i, s in enumerate(sy):
            k = i / max(1, nsy - 1)
            f = v['f0'] * pm * (ca + (cb - ca) * k) * (1 + rng.uniform(-jit, jit))
            if who == 'onde' and b.get('expr') == 'ngakak': f *= 1 + 0.2 * (i % 2)
            if s['punct'] == '?': fa, fb = f, f * 1.35
            elif s['punct'] == '!': fa, fb = f * 1.1, f * 0.9
            elif s['punct'] == '.': fa, fb = f, f * 0.85
            else: fa, fb = f * (1 + rng.uniform(-0.04, 0.04)), f * (1 + rng.uniform(-0.04, 0.04))
            d = base * scale * rng.uniform(0.85, 1.1)
            y = syl_sound(fa, fb, d, s['v'], v, rough, loud * (1.1 if s['punct'] == '!' else 1))
            o = int(t * SR); m = max(0, min(len(y), N - o)); out[o:o + m] += y[:m]; active[o:o + m] = 1
            t += units[i] * scale
    # gentle presence EQ: highpass 120Hz
    bb, aa = butter(2, 120 / (SR / 2), 'high'); out = lfilter(bb, aa, out)
    # smooth ducking envelope
    k = int(0.12 * SR); duck = np.convolve(active, np.ones(k) / k, mode='same')
    return out, np.clip(duck, 0, 1)
