# Workflow: dari ide ke video siap upload

Hasil akhir setiap putaran: **video MP4, thumbnail PNG, dan deskripsi postingan** di `out/<slug>/`.
Upload ke TikTok dilakukan manual oleh pemilik akun.

Sebelum mulai, baca [docs/style-guide.md](docs/style-guide.md): siapa penontonnya, format,
humor, tema, bahasa, hook, thumbnail, deskripsi postingan, dan batasan.

## 1. Cari bahan (10–15 menit)

- Cari yang sedang ramai di Indonesia minggu ini: tren dan sound TikTok, Google Trends Indonesia,
  berita hiburan dan lifestyle, istilah slang baru.
- Kumpulkan 5–8 kandidat, masing-masing dengan link sumber dan alasan kenapa sedang ramai.

## 2. Saring

Buang yang melanggar bagian **Batasan** di style guide (musibah, politik, SARA, orang sungguhan,
IP pihak lain, body shaming, menyasar di bawah 16 tahun). Sisakan yang bisa diterjemahkan ke
situasi sehari-hari penonton 16–24 tahun: bestie, crush, kampus/sekolah akhir, kos, keluarga,
healing, overthinking.

## 3. Tiga ide

Untuk 3 kandidat terbaik, tulis:

- **POV** satu kalimat dari sudut pandang penonton;
- **Twist** satu kalimat;
- **Siapa kena karma** dan bagaimana;
- **Hook** (≤ 2 baris, terbaca tanpa suara) dan **judul thumbnail** (≤ 5 kata).

Tren cukup jadi bumbu; lucunya tetap datang dari dinamika karakter:

- **Bakpi**: tukang jail, gampang salting, selalu kena karma.
- **Onde**: main character, drama queen, membalas dengan elegan.
- **Mbak Klepon**: kalem, cuek, idaman semua; muncul sebentar, dialog paling pendek, paling nendang.

Pemilik akun memilih satu ide.

## 4. Naskah

- 25–45 detik, sekitar 12–20 beat. Hook ≤ 3 detik → setup → eskalasi → twist → balasan →
  kartu penutup.
- Maksimal 2–3 slang per video, satu momen hangat, tanpa ceramah.
- Tulis sebagai JSON sesuai [docs/script-format.md](docs/script-format.md), simpan di
  `scripts/<slug>.json`. Isi `topic` (tren + link), `description` (lihat style guide bagian 9), `thumbnail`,
  dan `outro`.

## 5. Render dan periksa

```bash
node render.js scripts/<slug>.json --stills 1,8,20,35   # cek frame dulu
node render.js scripts/<slug>.json                       # video + thumbnail + deskripsi
```

Periksa stills: subtitle tidak menabrak karakter, karakter tidak terpotong, teks HP muat,
thumbnail terbaca saat dikecilkan.

## 6. Serahkan

Kirim ke pemilik akun: ringkasan tren + sumber, video, thumbnail, dan **deskripsi postingan ditulis
langsung di pesan** (siap disalin), selain file `<slug>-description.txt`. Pemilik akun yang
mengunggah:

1. TikTok → **+** → unggah video MP4.
2. **Edit cover** → unggah dari galeri → pilih thumbnail PNG.
3. Tempel deskripsi. Opsional: tambahkan sound yang sedang tren dan kecilkan suara asli.
4. Posting, atau simpan sebagai draf.
