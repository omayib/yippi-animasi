# Workflow: dari tren viral ke video

Panduan ini ditulis untuk dijalankan oleh Claude (manual di chat, atau sebagai tugas terjadwal),
tapi bisa juga diikuti manusia. Hasil akhirnya selalu **draf**: video, thumbnail, dan caption
yang menunggu persetujuan sebelum diposting.

## 1. Cari tren (10–15 menit riset)

- Cari isu yang sedang ramai di Indonesia **hari ini**: Google Trends Indonesia, berita hiburan
  dan lifestyle, topik yang ramai di TikTok/X, istilah slang baru.
- Kumpulkan 5–8 kandidat, masing-masing dengan sumber (link) dan alasan kenapa sedang ramai.

## 2. Saring

Buang kandidat yang:

- menyangkut musibah, kematian, kekerasan, kasus hukum, SARA, atau politik praktis;
- menertawakan orang sungguhan (nama asli, rupa, akun pribadi) atau korban;
- menyangkut merek/karakter/lagu milik pihak lain sebagai bahan utama;
- tidak cocok untuk penonton remaja.

Yang tersisa: tren yang bisa diterjemahkan ke **situasi sehari-hari** remaja cewek
(bestie, crush, sekolah, keluarga, jajan, outfit, HP, overthinking).

## 3. Pilih sudut pandang audiens

Untuk 3 kandidat terbaik, tulis satu kalimat "POV"-nya dari sudut pandang remaja cewek,
mis. tren "X lagi viral" → "POV: bestie kamu ikut-ikutan X padahal…". Tren cukup jadi bumbu;
lelucon utamanya tetap dinamika karakter:

- **Bakpi**: tukang jail, gampang salting, sering kena karma.
- **Onde**: main character, drama queen, pembalas dendam yang elegan.
- **Mbak Klepon**: kalem, cuek, idaman semua; muncul sedikit, efeknya besar.

## 4. Tulis naskah

- 45–80 detik, 25–35 beat. Struktur: hook 3–5 detik → setup → eskalasi → plot twist → balasan
  → kartu penutup dengan ajakan tag teman.
- Hook pertama harus bisa dipahami tanpa suara.
- Bahasa: Gen Z santai, tanpa makian, tanpa body shaming.
- Tulis langsung sebagai JSON sesuai [docs/script-format.md](docs/script-format.md), simpan di
  `scripts/<slug>.json`, isi `topic` dengan tren + link sumbernya.

## 5. Render dan periksa

```bash
node render.js scripts/<slug>.json --stills 2,10,30,50   # cek frame dulu
node render.js scripts/<slug>.json                       # video + thumbnail + caption
```

Lihat stills sebelum render penuh: subtitle tidak bertumpuk dengan karakter, karakter tidak
terpotong, teks HP muat.

## 6. Serahkan untuk disetujui

Kirim ke pemilik akun: ringkasan tren + sumber, video, thumbnail, caption. **Jangan posting
otomatis.** Pemilik akun yang memutuskan.
