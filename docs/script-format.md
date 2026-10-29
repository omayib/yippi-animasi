# Format naskah (JSON)

Satu video = satu file di `scripts/<slug>.json`. Mesin render membaca file ini apa adanya,
jadi semua yang muncul di layar (dialog, ekspresi, kamera, efek, sound) ditulis di sini.
`node render.js` memvalidasi naskah dulu dan berhenti dengan daftar kesalahan kalau ada nilai
yang tidak dikenal, jadi naskah buatan AI aman dicoba.

Contoh lengkap: [`scripts/wijen-gate.json`](../scripts/wijen-gate.json).

## Struktur atas

| Kunci | Wajib | Isi |
|---|---|---|
| `title` | ya | Judul video |
| `slug` | ya | Nama file output, huruf kecil-strip, mis. `wijen-gate` |
| `audience` | – | Catatan target audiens |
| `topic` | – | Tren/isu yang diangkat + sumbernya (untuk arsip) |
| `description` | ya | Deskripsi postingan TikTok, satu string atau daftar baris. Disimpan ke `<slug>-description.txt`. Lihat [style guide](style-guide.md#9-deskripsi-postingan). (`caption` lama masih dibaca.) |
| `thumbnail` | – | Cover TikTok, lihat [Thumbnail](#thumbnail) |
| `phone` | – | Isi layar HP saat beat memakai `phone`, lihat [HP](#layar-hp) |
| `outro` | – | `{"top": ["baris 1", "baris 2"], "bottom": [...]}` teks kartu penutup (kotak putih atas, kotak hitam bawah) |
| `beats` | ya | Daftar adegan pendek, diputar berurutan |

## Beat

Satu beat = satu baris dialog atau satu momen. Durasi total video = jumlah `dur`.

```json
{"scene": "a2", "dur": 2.4, "who": "bakpi", "text": "Situ. Situ. Situ juga.",
 "onde":  {"x": 330, "expr": "panik", "pose": "idle", "circ": [0, 3], "fx": ["sweat"]},
 "bakpi": {"x": 770, "expr": "serius", "pose": "pointL", "anim": "poke"},
 "cam": "two", "sfx": [[0.2, "ding1"], [0.9, "ding2"]], "music": "panic"}
```

| Kunci | Isi |
|---|---|
| `scene` | Nama bagian (`hook`, `a1`, …). Beat berurutan dengan nama sama dirender jadi satu file. |
| `dur` | Detik. Minimal kira-kira `0.6 + 0.035 × jumlah huruf` supaya subtitle terbaca. |
| `who`, `text` | Pembicara (`bakpi`/`onde`/`klepon`) dan subtitle. Mulut pembicara bergerak otomatis. |
| `bakpi`, `onde`, `klepon` | Karakter yang tampil di beat ini (lihat di bawah). Karakter yang tidak ditulis tidak muncul. |
| `cam` | `"two"` (dua karakter), `"wide"`, atau `{"z": 1.3, "cx": 360, "cy": 1000}`. Tambah `"cut": 1` untuk potong langsung, `"slow": 1` untuk zoom pelan sepanjang beat, `"punch": 1` untuk zoom kaget. |
| `sfx` | Daftar `[detik_dari_awal_beat, nama]`. |
| `music` | Ganti musik mulai beat ini: `happy`, `panic`, `villain`, `none`. |
| `hook` | 1–2 baris teks kotak putih di atas (untuk 3 detik pertama). |
| `shake`, `flash` | `1` untuk guncangan / kilat putih di awal beat. |
| `mirror` | `1` bingkai cermin oval. |
| `spinner` | `1` atau teks, ikon loading di tengah (default "otak lagi loading..."). |
| `talkSkip` | Detik awal beat di mana mulut belum bergerak. |
| `tint` | `1` filter ungu ala villain. |
| `villain` | Teks besar merah, mis. `"REVENGE ARC"`. |
| `phone` | `{"show": n}` layar chat menampilkan `n` pesan pertama dari `script.phone.thread`, pesan terbaru muncul dengan animasi; tambah `"typing": true` untuk indikator mengetik. Format lama `"typing"`/`"reply"` masih bisa. |
| `rec` | `1` tampilan sedang merekam (titik merah REC + bingkai kamera). |
| `slowmo` | `1` gerakan melambat + label `0.5x`. |
| `outro` | `1` kartu penutup dengan teks dari `script.outro`. |
| `big` | `1` karakter lebih besar (dipakai di outro). |

### Karakter di dalam beat

| Kunci | Isi |
|---|---|
| `x` | Posisi horizontal di dunia 1080 px. Dua karakter biasa: Onde/kiri `330`, Bakpi/kanan `770`. Keluar layar: `-320` atau `1400`. |
| `expr` | `senang`, `marah`, `sedih`, `kaget`, `datar`, `serius`, `licik`, `ngakak`, `salting`, `panik`, `nangis`, `cool` |
| `pose` | `idle`, `up`, `hips`, `down`, `kaget`, `pointL`, `face`, `phone`, `blangkon`, `wave`, `laugh`, `nails` |
| `anim` | `idle` (default), `none`, `shake`, `jump`, `roll`, `droop`, `sob`, `hop`, `walk`, `poke` |
| `fx` | `sparkle`, `sweat`, `anger`, `tears`, `hearts`, `skulls`, `cracks`, `shatter` |
| `enter` | `1` masuk dari kanan dengan pop |
| `move` | Detik untuk berjalan dari posisi beat sebelumnya ke `x` ini |
| `vis` | `0` sembunyikan |
| `circ` | `[dari, sampai]` lingkaran merah di wijen Onde (khusus Onde) |
| `crack` | `[dari, sampai]` retakan 0–1 (dipakai bersama `fx: ["cracks"]`) |

### Sound effect

`pop`, `whoosh`, `boing`, `vineboom`, `ding1`, `ding2`, `ding3`, `dingroll`, `rub`, `sad`,
`scratch`, `dramatic`, `laugh`, `grr`, `dun`, `cute`, `sparkle`, `typing`, `notif`, `cricket`,
`crack`, `shatter`, `tada`. Semuanya disintesis di `audio/audio.py`, bebas hak cipta.

## Thumbnail

```json
"thumbnail": {
  "pill": "POV: bestie kamu tukang prank",
  "headline": ["ADA WIJEN", "DI MUKAMU?!"],
  "sticker": "plot twist-nya 💀",
  "hero": {"id": "onde", "expr": "panik", "pose": "face", "fx": ["sweat"], "circ": 16},
  "side": {"id": "bakpi", "expr": "ngakak", "pose": "laugh"},
  "emoji": "💀",
  "arrow": true
}
```

Baris pertama `headline` mendapat blok kuning. Teks yang terlalu panjang mengecil otomatis.
Judul dan wajah karakter utama berada di area tengah 3:4 supaya utuh di grid profil TikTok.

## Layar HP

```json
"phone": {
  "contact": {"id": "klepon", "name": "Mbak Klepon 🌿", "status": "aktif 1 menit lalu"},
  "earlierLabel": "3 minggu lalu",
  "earlier": [{"me": true, "text": "hai mbak klepon 🥺👉👈"}, {"me": true, "text": "p"}],
  "readLabel": "Dibaca", "todayLabel": "Hari ini",
  "reply": "siapa ya?"
}
```

Maksimal 4 pesan di `earlier`. `me: true` = pesan keluar (biru, kanan).

Untuk percakapan yang muncul bertahap, isi `thread` dan pakai `"phone": {"show": n}` di tiap beat
(lihat [`scripts/jawab-satu-kata.json`](../scripts/jawab-satu-kata.json)):

```json
"phone": {
  "contact": {"id": "klepon", "name": "Mbak Klepon 🌿", "status": "online"},
  "thread": [{"me": true, "text": "Kita cocok gak?"}, {"me": false, "text": "Gak."}]
}
```

Pesan panjang otomatis dibungkus ke beberapa baris; layar menggulir sendiri saat penuh.
