# yippi-animasi

Mesin animasi 2D untuk konten TikTok dengan karakter jajanan pasar: **Bakpi**, **Onde**, dan
**Mbak Klepon**. Satu naskah JSON menghasilkan video vertikal 1080×1920 30 fps lengkap dengan
subtitle, gerakan kamera, efek, musik chiptune, sound effect, thumbnail, dan caption.

Semua gambar dan suara dibuat dengan kode, jadi tidak ada aset pihak ketiga yang perlu lisensi
(kecuali font Poppins, lisensi SIL OFL).

## Cara pakai

```bash
npm install
npx playwright install chromium        # sekali saja
node render.js scripts/wijen-gate.json
```

Hasil di `out/wijen-gate/`:

- `wijen-gate.mp4` video siap upload
- `wijen-gate-thumbnail.png` cover TikTok
- `wijen-gate-caption.txt` caption + hashtag

Opsi lain:

| Perintah | Fungsi |
|---|---|
| `--stills 3,12.5,40` | Simpan frame di detik tertentu sebagai JPEG, untuk cek cepat |
| `--thumb` | Hanya thumbnail |
| `--voice` | Tambah suara gibberish kartun (Bakpi rendah, Onde tinggi), musik mengecil saat bicara |
| `--out DIR` | Folder output lain |

Render 80 detik butuh sekitar 2 menit di mesin 2 core.

## Kebutuhan

- Node.js 18+, Python 3.10+ (`pip install -r requirements.txt`), `ffmpeg`
- Font emoji berwarna (Noto Color Emoji) terpasang di sistem

## Isi repo

```
render.js            CLI: validasi naskah → frame → ffmpeg → audio → mux
engine/scene.js      karakter, ekspresi, pose, latar, kamera, efek, subtitle
engine/thumb.js      thumbnail dari script.thumbnail
engine/index.html    kanvas 1080×1920 + font
audio/audio.py       musik chiptune + sound effect sintetis
audio/voice.py       suara gibberish kartun (opsional)
scripts/*.json       naskah video
docs/script-format.md  referensi format naskah
docs/style-guide.md    siapa penontonnya dan gaya konten yang dipakai
WORKFLOW.md          alur ide → naskah → render → upload manual
```

## Membuat video baru

1. Baca [docs/style-guide.md](docs/style-guide.md), lalu ikuti [WORKFLOW.md](WORKFLOW.md) untuk memilih ide.
2. Salin `scripts/wijen-gate.json`, ganti isinya. Referensi lengkap ada di
   [docs/script-format.md](docs/script-format.md).
3. `node render.js scripts/<slug>.json --stills 2,20,40` untuk cek, lalu render penuh.

Naskah divalidasi sebelum render. Nilai yang salah (ekspresi tak dikenal, durasi terlalu pendek
untuk dibaca, sound effect yang tidak ada) dilaporkan semuanya sekaligus.

## Upload

Upload ke TikTok dilakukan manual: unggah MP4, pasang thumbnail lewat **Edit cover**, tempel
caption dari `<slug>-caption.txt`. Langkah lengkap ada di [WORKFLOW.md](WORKFLOW.md).

`tools/tiktok_upload.py` dan halaman di `site/` adalah eksperimen TikTok Content Posting API;
tidak dipakai dalam workflow utama.
