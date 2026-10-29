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
WORKFLOW.md          alur riset tren → naskah → render → review
```

## Membuat video baru

1. Ikuti [WORKFLOW.md](WORKFLOW.md) untuk memilih tren dan sudut pandang.
2. Salin `scripts/wijen-gate.json`, ganti isinya. Referensi lengkap ada di
   [docs/script-format.md](docs/script-format.md).
3. `node render.js scripts/<slug>.json --stills 2,20,40` untuk cek, lalu render penuh.

Naskah divalidasi sebelum render. Nilai yang salah (ekspresi tak dikenal, durasi terlalu pendek
untuk dibaca, sound effect yang tidak ada) dilaporkan semuanya sekaligus.

## Kirim ke TikTok (draft)

`tools/tiktok_upload.py` mengirim video ke **inbox TikTok sebagai draft** lewat Content Posting API
(scope `video.upload`). Tool ini tidak pernah memposting sendiri: Anda membuka notifikasi di
aplikasi TikTok, mengedit caption, lalu memutuskan kapan posting.

Jalankan di komputer Anda sendiri (butuh akses internet ke `open.tiktokapis.com`):

```bash
pip install -r requirements.txt
python3 tools/tiktok_upload.py setup      # sekali: Client Key + Client Secret dari Developer Portal
python3 tools/tiktok_upload.py login      # buka link, setujui, salin kode dari halaman "TikTok connected"
python3 tools/tiktok_upload.py upload out/wijen-gate/wijen-gate.mp4
python3 tools/tiktok_upload.py whoami     # cek akun yang terhubung
python3 tools/tiktok_upload.py logout     # cabut akses + hapus token
```

- Client Secret dan token disimpan di `~/.short-and-fun/` (mode 600), **tidak pernah di repo**.
  Token dienkripsi; kuncinya ada di folder yang sama. Client Secret juga bisa diberikan lewat
  variabel `TIKTOK_CLIENT_SECRET`.
- Redirect URI yang didaftarkan di TikTok: `https://omayib.github.io/yippi-animasi/callback.html`.
- Batas TikTok: maksimal 5 video menunggu di inbox per 24 jam, 6 request/menit per token.
- Selama aplikasi belum lolos audit TikTok, gunakan Sandbox dan tambahkan akun Anda sebagai
  target user di Developer Portal.

Halaman publik (beranda, Terms of Service, Privacy Policy, callback) ada di `site/` dan
dipublikasikan otomatis ke GitHub Pages oleh `.github/workflows/pages.yml`.
