"""Music + sound effects (+ optional gibberish voices) for a yippi-animasi script.

Usage: python3 audio/audio.py scripts/x.json out/x.wav [--voice]
"""
import json, os, sys, wave, numpy as np
SR = 44100
rng = np.random.default_rng(7)
SCRIPT_PATH, OUT_PATH = sys.argv[1], sys.argv[2]
WITH_VOICE = '--voice' in sys.argv
_s = json.load(open(SCRIPT_PATH)); _beats = []; _acc = 0.0
for _b in _s['beats']:
    _beats.append({'t0': _acc, 'dur': _b['dur'], 'sfx': _b.get('sfx', []), 'music': _b.get('music'), 'who': _b.get('who'), 'text': _b.get('text'),
                   'expr': (_b.get(_b['who']) or {}).get('expr') if _b.get('who') else None, 'talkSkip': _b.get('talkSkip', 0)})
    _acc += _b['dur']
d = {'beats': _beats, 'total': _acc}
T = d['total'] + 0.5
N = int(T * SR)
music = np.zeros(N); sfx = np.zeros(N)

def add(out, o, s):
    n = max(0, min(len(s), len(out) - o)); out[o:o + n] += s[:n]
def tt(dur): return np.arange(int(dur * SR)) / SR
def env(n, a=0.005, r=None, curve=4):
    t = np.arange(n) / SR; e = np.minimum(1, t / a) if a > 0 else np.ones(n)
    return e * np.exp(-curve * t / (n / SR))
def sq(f, t, duty=0.5): return np.where((f * t) % 1 < duty, 1.0, -1.0)
def tri(f, t): return 2 * np.abs(2 * ((f * t) % 1) - 1) - 1
def noise(n): return rng.uniform(-1, 1, n)
def lp(x, k=0.1):
    y = np.zeros_like(x); a = 0
    for i in range(len(x)): a += k * (x[i] - a); y[i] = a
    return y
def lpf(x, k):  # fast one-pole via numpy cumulative trick (approx with convolution)
    n = int(1 / k * 4) + 1; ker = k * (1 - k) ** np.arange(n); return np.convolve(x, ker)[:len(x)]

def mk(name):
    if name == 'pop': t = tt(0.1); return np.sin(2 * np.pi * (500 + 4000 * t) * t) * env(len(t), 0.002, curve=6) * 0.6
    if name == 'whoosh': n = int(0.4 * SR); x = lpf(noise(n), 0.08); return x * np.sin(np.linspace(0, np.pi, n)) ** 2 * 1.4
    if name == 'boing': t = tt(0.55); f = 180 + 120 * np.exp(-t * 6) * np.sin(2 * np.pi * 14 * t) + 140 * t; return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.003, curve=4) * 0.6
    if name == 'vineboom':
        t = tt(1.6); f = 70 * np.exp(-t * 0.8) + 38; x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(4 * np.pi * np.cumsum(f) / SR)
        x = np.tanh(3 * x) * env(len(t), 0.002, curve=3.2); x[:800] += noise(800) * np.linspace(1, 0, 800) * 0.6; return x * 0.9
    if name.startswith('ding'):
        base = {'ding1': 1046, 'ding2': 1318, 'ding3': 1568}.get(name, 1046); t = tt(0.45)
        return (np.sin(2 * np.pi * base * t) + 0.4 * np.sin(2 * np.pi * base * 2.01 * t)) * env(len(t), 0.002, curve=7) * 0.35
    if name == 'dingroll':
        out = np.zeros(int(2.4 * SR)); notes = [1046, 1174, 1318, 1396, 1568, 1760, 1976, 2093, 2349, 2637]
        for i, f in enumerate(notes):
            t = tt(0.3); s = (np.sin(2 * np.pi * f * t)) * env(len(t), 0.002, curve=8) * 0.3; o = int((0.1 + i * 0.17) * SR) - int(0.1 * SR); add(out, o, s)
        return out
    if name == 'rub':
        n = int(2.0 * SR); x = lpf(noise(n), 0.25); m = (np.sin(2 * np.pi * 7 * np.arange(n) / SR) > 0).astype(float); return x * m * 0.35 * np.minimum(1, np.linspace(4, 0, n))
    if name == 'sad':
        out = np.zeros(int(2.2 * SR))
        for i, f in enumerate([392, 370, 349, 330]):
            dur = 0.35 if i < 3 else 1.1; t = tt(dur); vib = 1 + 0.012 * np.sin(2 * np.pi * 6 * t)
            s = (0.6 * sq(f * vib, t, 0.5) + 0.4 * tri(f * vib, t)) * env(len(t), 0.01, curve=2.5) * 0.18; o = int(i * 0.38 * SR); add(out, o, s)
        return out
    if name == 'scratch':
        t = tt(0.55); f = 900 * np.abs(np.sin(2 * np.pi * 2.2 * t)) + 120; x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + lpf(noise(len(t)), 0.3) * 0.5
        return x * env(len(t), 0.003, curve=3) * 0.6
    if name == 'dramatic':
        t = tt(1.0); return (sq(98, t) * 0.5 + sq(196.5, t) * 0.3) * env(len(t), 0.005, curve=3) * 0.18
    if name == 'laugh':
        out = np.zeros(int(2.4 * SR))
        for i in range(10):
            t = tt(0.13); f = 520 + 60 * (i % 2) - i * 12; s = sq(f, t, 0.25) * env(len(t), 0.003, curve=4) * 0.12; o = int(i * 0.2 * SR); add(out, o, s)
        return out
    if name == 'grr': t = tt(0.8); return np.tanh(4 * sq(70, t) * (0.6 + 0.4 * np.sin(2 * np.pi * 25 * t))) * env(len(t), 0.01, curve=3) * 0.15
    if name == 'dun':
        out = np.zeros(int(2.0 * SR))
        for i, (f, dur) in enumerate([(146.8, 0.3), (138.6, 0.3), (130.8, 1.3)]):
            t = tt(dur); saw = 2 * ((f * t) % 1) - 1; s = lpf(saw + 0.5 * (2 * ((f * 2.003 * t) % 1) - 1), 0.12) * env(len(t), 0.01, curve=2) * 0.7
            o = int(i * 0.34 * SR); add(out, o, s)
        return out
    if name == 'cute':
        out = np.zeros(int(1.2 * SR))
        for i, f in enumerate([784, 988, 1175, 1568]):
            t = tt(0.18); s = tri(f, t) * env(len(t), 0.003, curve=5) * 0.3; o = int(i * 0.09 * SR); add(out, o, s)
        return out
    if name == 'sparkle':
        out = np.zeros(int(1.2 * SR))
        for i, f in enumerate([1568, 2093, 2637, 3136, 4186]):
            t = tt(0.35); s = np.sin(2 * np.pi * f * t) * env(len(t), 0.002, curve=6) * 0.18; o = int(i * 0.07 * SR); add(out, o, s)
        return out
    if name == 'typing':
        out = np.zeros(int(1.0 * SR))
        for i in range(7): n = int(0.02 * SR); o = int((i * 0.13 + rng.uniform(0, 0.04)) * SR); add(out, o, noise(n) * np.linspace(1, 0, n) * 0.25)
        return out
    if name == 'notif':
        out = np.zeros(int(0.8 * SR))
        for i, f in enumerate([880, 1318]):
            t = tt(0.35); s = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * env(len(t), 0.002, curve=5) * 0.4; o = int(i * 0.12 * SR); add(out, o, s)
        return out
    if name == 'cricket':
        out = np.zeros(int(1.8 * SR))
        for c in range(3):
            for k in range(4):
                t = tt(0.025); s = np.sin(2 * np.pi * 4400 * t) * np.sin(np.pi * t / 0.025) * 0.15; o = int((0.15 + c * 0.55 + k * 0.04) * SR); add(out, o, s)
        return out
    if name == 'crack':
        n = int(0.25 * SR); x = noise(n) * env(n, 0.0005, curve=12) * 0.8; t = tt(0.25); x += np.sin(2 * np.pi * 3200 * t) * env(n, 0.001, curve=10) * 0.2; return x
    if name == 'shatter':
        n = int(2.0 * SR); x = noise(n) * env(n, 0.001, curve=6) * 0.5
        for i in range(40):
            f = rng.uniform(2500, 7000); t = tt(rng.uniform(0.1, 0.4)); s = np.sin(2 * np.pi * f * t) * env(len(t), 0.0005, curve=8) * 0.12; o = int(rng.uniform(0, 1.2) * SR); add(x, o, s)
        return x
    if name == 'tada':
        out = np.zeros(int(1.6 * SR))
        for i, (f, dur) in enumerate([(523, 0.12), (659, 0.12), (784, 0.12), (1046, 1.0)]):
            t = tt(dur); s = (sq(f, t, 0.25) * 0.5 + tri(f / 2, t) * 0.5) * env(len(t), 0.003, curve=2.5 if dur > 0.5 else 4) * 0.2; o = int(i * 0.11 * SR); add(out, o, s)
        return out
    raise ValueError(name)

for b in d['beats']:
    for off, name in b['sfx']:
        x = mk(name); o = int((b['t0'] + off) * SR); x = x[:max(0, N - o)]; sfx[o:o + len(x)] += x

# music sections
secs = []; cur = None
for b in d['beats']:
    m = b.get('music')
    if m is not None and m != cur:
        secs.append([b['t0'], m]); cur = m
secs = [(s[0], secs[i + 1][0] if i + 1 < len(secs) else T, s[1]) for i, s in enumerate(secs)]

def midi(n): return 440 * 2 ** ((n - 69) / 12)
def song(style, dur):
    out = np.zeros(int(dur * SR) + SR)
    if style == 'none': return out
    if style == 'happy':
        bpm = 128; prog = [(60, 64, 67), (57, 60, 64), (53, 57, 60), (55, 59, 62)]
        mel = [72, 76, 79, 76, 77, 76, 74, 72, 69, 72, 76, 72, 74, 72, 71, 67, 65, 69, 72, 69, 72, 74, 76, 72, 67, 71, 74, 71, 74, 76, 74, 71]
        lead_v, bass_v, duty = 0.07, 0.11, 0.25
    elif style == 'panic':
        bpm = 168; prog = [(62, 65, 69), (62, 65, 69), (63, 67, 70), (61, 64, 69)]
        mel = [74, 77, 74, 77, 75, 74, 72, 74, 74, 77, 81, 77, 75, 74, 73, 69] * 2
        lead_v, bass_v, duty = 0.06, 0.11, 0.125
    else:  # villain
        bpm = 96; prog = [(57, 60, 64), (57, 60, 64), (53, 57, 60), (52, 56, 59)]
        mel = [69, None, 72, 71, 69, None, 64, None, 65, None, 64, 62, 64, None, None, None] * 2
        lead_v, bass_v, duty = 0.06, 0.13, 0.5
    st = 60 / bpm / 2  # eighth note
    nsteps = int(dur / st) + 1
    for i in range(nsteps):
        o = int(i * st * SR); bar = (i // 8) % 4; chord = prog[bar]
        # bass on every eighth (octave bounce)
        f = midi(chord[0] - 24 + (12 if i % 2 else 0)); t = tt(st * 0.9); s = tri(f, t) * env(len(t), 0.003, curve=2) * bass_v
        add(out, o, s)
        # arp
        f = midi(chord[i % 3] + 12); t = tt(st * 0.5); s = sq(f, t, 0.5) * env(len(t), 0.002, curve=5) * 0.025; add(out, o, s)
        # lead
        n = mel[i % len(mel)]
        if n is not None:
            f = midi(n); t = tt(st * 0.85); vib = 1 + 0.006 * np.sin(2 * np.pi * 6 * t)
            s = sq(f * vib, t, duty) * env(len(t), 0.004, curve=1.8) * lead_v; add(out, o, s)
        # hat / kick
        if style != 'villain' or i % 2 == 0:
            n2 = int(0.02 * SR); add(out, o, noise(n2) * np.linspace(1, 0, n2) * 0.04)
        if i % 4 == 0:
            t = tt(0.15); s = np.sin(2 * np.pi * np.cumsum(120 * np.exp(-t * 30) + 45) / SR) * env(len(t), 0.001, curve=5) * 0.25; add(out, o, s)
    return out

for a, b_, style in secs:
    seg = song(style, b_ - a); o = int(a * SR); L = int((b_ - a) * SR); seg = seg[:L].copy()
    f = min(len(seg), int(0.03 * SR)); seg[-f:] *= np.linspace(1, 0, f)
    music[o:o + len(seg)] += seg[:N - o]

if WITH_VOICE:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from voice import render_voice
    voice, duck = render_voice(d['beats'], N)
else:
    voice, duck = np.zeros(N), np.zeros(N)
mix = music * 0.55 * (1 - 0.45 * duck) + sfx * (0.85 if WITH_VOICE else 1.0) + voice * 0.9
mix = np.tanh(mix * 1.1) * 0.9
fo = int(0.4 * SR); end = int(d['total'] * SR); mix[end - fo:end] *= np.linspace(1, 0, fo); mix[end:] = 0
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open(OUT_PATH, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('audio', len(pcm) / SR, 'peak', np.abs(mix).max())
