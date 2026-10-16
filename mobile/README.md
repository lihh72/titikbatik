# TitikBatik Mobile

App React Native + Expo SDK 57 untuk iOS, dengan native tabs dan Liquid Glass asli pada iOS 26+. Tampilan solid menjadi fallback pada perangkat yang tidak mendukung atau ketika Reduce Transparency aktif. Tidak menggunakan WebView.

## Menjalankan di Expo Go

Prasyarat: Node.js 22.13+ (disarankan Node 24 LTS), npm, dan Expo Go yang mendukung SDK 57 pada iPhone.

```powershell
cd mobile
npm.cmd ci
npx.cmd expo login
npx.cmd expo start
```

Di macOS/Linux, gunakan `npm` dan `npx` tanpa `.cmd`. Login dengan **akun Expo yang sama** pada CLI dan Expo Go iOS, kemudian scan QR dengan kamera iPhone. Komputer dan iPhone harus berada di jaringan yang sama. [Kebutuhan login Expo Go SDK 57](https://expo.dev/changelog/expo-go-57-login).

App pertama kali terbuka dalam **mode demo offline**, langsung ke katalog. Semua motif, costume, dan video demo dibundel; backend maupun API AI tidak diperlukan. Saat pengembangan, pemuatan JavaScript pertama melalui Metro tetap membutuhkan koneksi ke komputer. Setelah bundle dimuat, fitur demo tidak mengakses server data.

Jika QR LAN tidak dapat diakses, jalankan `npx expo start --tunnel`. Tunnel Metro hanya mengekspos bundle app; **alamat API Next.js tetap harus bisa diakses iPhone secara terpisah**. Proses login dan pemindaian QR dilakukan pengguna di perangkatnya.

## Menghubungkan backend asli

Untuk binary mandiri APK dan IPA unsigned yang dapat di-sign 7 hari dari Windows, lihat [BUILD.md](./BUILD.md).

1. Jalankan FastAPI dan worker sesuai README `../automation`.
2. Konfigurasikan `../web/.env.local` sesuai `../web/.env.example`. Untuk chatbot, server juga membutuhkan `MODEL_API_KEY`; `MODEL_API_BASE_URL` dan `MODEL_API_MODEL` opsional mengikuti implementasi web.
3. Jalankan web agar bisa diakses dari LAN:

```powershell
cd ../web
npm.cmd run dev -- --hostname 0.0.0.0
```

4. Buka gear di Koleksi → **Sumber data: Backend asli** → masukkan `http://IP-KOMPUTER:3000` atau origin HTTPS server Next.js → tombol centang di navigation bar. Allow akses jaringan lokal ketika iOS memintanya. Untuk LAN, port 3000 perlu diizinkan pada firewall komputer.

`localhost` dan `127.0.0.1` pada iPhone menunjuk ke iPhone. Gunakan IP LAN komputer (`ipconfig` pada Windows). Backend FastAPI tidak perlu diekspos langsung: Next.js memproksi API publik dan menyediakan endpoint chatbot.

Alamat awal opsional dapat diisi melalui `.env.local`:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:3000
```

Environment hanya menjadi nilai alamat awal; mode tetap demo sampai dipilih di pengaturan. Override dari pengaturan tersimpan di perangkat. Setelah mengubah environment, restart Metro. Jangan memasukkan `ADMIN_API_KEY`, `MODEL_API_KEY`, password, atau secret lain ke `EXPO_PUBLIC_*`.

Tidak ada perpindahan otomatis ke demo saat server gagal. Error ditampilkan dengan retry; pilih demo sendiri melalui pengaturan.

## Fitur

- Latar utama seluruh aplikasi hitam `#000000`, dengan teks paper `#f4f1e9`, panel gelap, dan aksen terracotta mengikuti identitas web. Katalog dibuka dengan pengantar singkat dan satu motif sorotan yang dapat diketuk. Grid Nyaman dua kolom menjadi default; Rapat memakai tiga kolom. Tersimpan memakai dua kolom dengan bookmark untuk menghapus langsung dari kartu. Pengantar disembunyikan selama pencarian.
- Beranda katalog menampilkan banner motif + busana, pilihan gaya horizontal dari data katalog, serta kartu tinggi dengan bookmark overlay dan jumlah media. Memilih gaya menjalankan pencarian gaya; mengetik pencarian mengganti pilihan gaya, sehingga kontrak pencarian backend tetap utuh. Bagian “Motif jadi busana” membuka detail langsung pada media costume. Refresh mempertahankan kartu yang sudah dimuat selama mengambil data terbaru.
- Tiga tab: Koleksi, Tersimpan, Asisten, masing-masing memiliki native stack. Halaman selanjutnya dimuat saat menggulir; pull-to-refresh tetap tersedia.
- Header iOS kembali memakai native stack per tab seperti binary pertama 14 Oktober, dengan large title dan search controller UIKit pada Koleksi; judul Tersimpan/Asisten berada dalam konten yang bergulir. Root header tab disembunyikan agar tidak ada dua bar. Satu logo image dan wordmark serif paper/terracotta bergerak mengikuti scroll ke bar melalui shared chrome; native large-title text tidak digambar agar judul tidak ganda. Kontrol kanan atas tetap terpasang di root di atas navigator, termasuk selama detail dan transisi kembali. Mode tujuan back dipilih saat transisi native mulai; pembatalan gesture memulihkan mode detail. Judul native disembunyikan dengan title view kosong nyata, tanpa placeholder whitespace. Kontrol glass dan SF Symbols tetap digunakan.
- Tombol titik tiga berubah menjadi tutup melalui animasi, sementara tombol pengaturan tetap terlihat. Panel pilihan Nyaman/Rapat memakai indikator geser dan Liquid Glass native pada perangkat yang mendukung. Panel layout mengambang tanpa mendorong daftar. Daftar virtual tetap terpasang saat jumlah kolom berubah, dengan transisi baris Reanimated. Hasil lama dipertahankan selama permintaan filter berlangsung agar tidak berkedip kosong; pergantian sumber data tetap mengosongkan data sebelumnya. Reduce Motion menonaktifkan animasi, dan Reduce Transparency memakai permukaan solid.
- Haptik melalui `expo-haptics` pada perpindahan tab, membuka motif, simpan/suka, menu/pengaturan, refresh, thumbnail/swipe media, disclosure prompt, berbagi, kirim chat, hasil chat, lampiran dan penyimpanan pengaturan. Pemicu berdekatan digabung selama 90 ms, diabaikan saat background/web, dan kegagalan hardware tidak mengganggu aksi. Tidak ada haptik saat mengetik atau untuk setiap token streaming.
- Pengaturan iOS memakai SwiftUI Form, Section, Picker dan TextField dalam native form sheet. Tampilan non-iOS menggunakan fallback terpisah.
- Blur dan gerakan header iOS kembali dikelola UIKit dengan scroll edge automatic, tanpa overlay BlurView tambahan. Katalog memakai `Stack.SearchBar` dengan placement stacked; search tetap tampil dan mengikuti perubahan ukuran navigation bar saat scroll. ScrollView/FlatList memakai automatic content insets agar posisi awal tidak tertutup header. Detail mempertahankan native back gesture dan judul tab asal.
- Suka dan bookmark lokal. Riwayat, bookmark, dan suka dipisahkan antara demo dan setiap alamat backend; tidak ada sinkronisasi akun. Bookmark backend menyimpan metadata dan URL, bukan mengunduh seluruh media untuk offline.
- Share sheet membagikan file media aktif; file unduhan sementara dibersihkan setelah selesai. iOS menyediakan tujuan berbagi/penyimpanan sesuai tipe file.
- Chatbot streaming dengan protokol SSE web (`token`, `batik`, `error`, `done`), kartu karya, stop, retry, dan hapus riwayat. Stream dihentikan saat tab/layar ditinggalkan. Riwayat teks tersimpan; isi gambar tidak disimpan permanen.
- Lampiran dari photo picker pada mode backend. HEIC dan gambar lain dikonversi JPEG, sisi terpanjang maksimal 1600 px, hasil maksimal 5 MB. Pesan maksimal 2000 karakter, konteks server menggunakan 10 pesan terakhir.
- Demo chatbot memberi jawaban deterministik **berlabel simulasi**, tanpa analisis gambar atau koneksi AI.
- Tema gelap tetap sesuai pilihan desain, teks scalable, safe area, Reduce Motion, dan Reduce Transparency. Preview web memakai tab JavaScript; iOS/Android memakai tab native.

## Struktur

- `src/app`: layar Expo Router; `(tabs)` dan native stack detail/modal.
- `src/lib`: kontrak adapter katalog, normalisasi media, SSE, demo, sharing dan storage.
- `src/state`: settings serta preferensi per sumber data melalui AsyncStorage.
- `assets/demo`: salinan aset lokal agar tetap tersedia di checkout lain.

Kontrak backend tetap menggunakan `GET /api/automation/public/batiks`, `/batiks/search`, `/batiks/{slug}`, media `/images/{category}/{filename}`, dan `POST /api/chat`. App tidak mengubah web atau backend. UI iOS menggabungkan React Native, UIKit, dan SwiftUI melalui modul Expo Go; tidak menggunakan WebView.

Preview browser tidak merender UIKit atau SwiftUI. File `.ios.tsx` digunakan pada iPhone, sedangkan file tanpa suffix menyediakan fallback web/Android. Nilai kualitas native melalui Expo Go di iPhone, terutama transisi header/glass antar-tab dan detail, efek tekan glass serta perluasan blur saat scroll, pencarian, menu tekan-lama, pager media, dan sheet pengaturan.

## Pemeriksaan otomatis

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run doctor
npm.cmd run export:ios
```

Test mencakup adapter, URL media, pencarian/paginasi, storage antarmode/server, chunk SSE termasuk UTF-8 terpotong, error, dan abort. Bundle iOS memastikan resolusi modul dan bundling aset; tidak membuktikan rendering native.

## Pemeriksaan perangkat sebelum rilis

- Di iPhone iOS 26+, buka melalui Expo Go SDK 57; periksa glass tab bar dan kontrol detail, gesture kembali, notch, serta keyboard chat.
- Ketuk titik tiga, pilih Rapat/Nyaman, lalu tutup panel; pastikan kontrol kanan atas tetap terlihat dan animasi tidak melompat. Rasakan haptik pada tab, bookmark, suka, pergantian media, dan kirim chat. Getaran fisik perlu diperiksa pada iPhone; browser tidak menjalankan haptik.
- Uji dengan tema sistem terang/gelap: app tetap memakai latar hitam. Aktifkan ukuran teks besar, Reduce Motion, dan Reduce Transparency; pastikan teks dan semua kontrol terbaca.
- Mode demo: jelajahi tujuh karya dari hasil generation proyek, buka sorotan, cari `geometris` dan kata tanpa hasil, pilih Rapat/Nyaman dari menu toolbar, pastikan judul tetap terbaca, simpan lewat kartu atau tekan-lama pada mode Nyaman maupun Rapat, buka ulang app, geser media, jalankan video, dan bagikan file. Demo tujuh karya dimuat dalam satu halaman; backend memakai pagination otomatis.
- Mode backend: uji server aktif/mati, pencarian, refresh, batik yang tidak ada, media gagal, serta respons chatbot normal, stop/retry, dan provider tidak tersedia.
- Pilih/batalkan lampiran gambar, uji foto HEIC dan gambar besar, pastikan keyboard tidak menutup composer. Hapus riwayat dan pindah mode; data kedua mode harus tetap terpisah.
- Pada iOS sebelum 26 atau Android, pastikan fallback solid dan tab native tetap berfungsi. Android tidak menjadi target QA utama versi ini.

Pengujian visual dan native di iPhone memerlukan perangkat nyata; environment Windows tidak menyediakan simulator iOS.
