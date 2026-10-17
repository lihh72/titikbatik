# Optimasi mobile — 17 Oktober 2026

## Lingkup

Tidak mengubah desain, timing/easing animasi, gaya Liquid Glass, haptik, posisi header/search, refresh native atau kualitas aset. Tidak menambah dependency atau mengganti versi Expo/Router. Perbaikan cold boot yang telah disetujui tetap dipertahankan.

## Perubahan

- Context katalog/pengaturan, bookmark, suka dan pesan chat dipisahkan. Konsumen berlangganan bagian yang digunakan; token chat tidak lagi memperbarui context katalog, kartu dan Tersimpan. Callback aksi serta value provider stabil.
- Data baris grid, hero, key hero dan daftar Tersimpan dimemoisasi. Render row memakai callback stabil dan komponen memo. Kategori, costume rail, hero, konten tile dan Markdown chat memo hanya ketika props berubah. Struktur native view dan angka animasi grid 280/220/160 ms tetap sama.
- Penggabungan halaman menggunakan Set untuk lookup ID: O(n+m), dengan urutan, object identity dan semantik duplikasi yang sama.
- PreferenceWriter menggabungkan snapshot chat dalam jendela tetap 250 ms, dengan JSON.stringify hanya ketika snapshot terbaru benar-benar ditulis. Satu penulisan aktif per key; pending snapshot lama digantikan yang terbaru. Bookmark/suka bypass buffer. Buffer di-flush ketika app inactive/background, scope unmount, dan sebelum scope dibaca kembali. Format/key AsyncStorage tidak berubah.
- Buffer chat tidak mengubah cadence token UI. Pada penghentian proses mendadak tanpa lifecycle event, maksimal jendela buffer terakhir dapat belum tersimpan; bookmark/suka tidak memakai delay tersebut. Ini bukan penyimpanan transaksional terhadap OS force-kill.

## Verifikasi

- TypeScript dan lint lolos tanpa warning.
- 36 tes lolos, termasuk 6 regresi writer: snapshot terakhir lengkap, penulisan lambat tetap berurutan, isolasi mode/server, bookmark segera, kegagalan storage dan clear history tanpa stale restore. Tes penggabungan halaman membandingkan hasil dengan algoritma lama.
- Ekspor iOS lolos: 1741 modul, 37 aset, bundle sekitar 3.9 MB.
- Hash sebelum/sesudah identik untuk loop-carousel, boot-entrance, header-title, header-actions, header-scroll, catalog-wordmark, catalog-chrome.ios, tab-stack, category-chip dan video.
- Browser smoke: pencarian Kawung + filter Geometris memberi 1 motif; bookmark muncul di Tersimpan dan bertahan setelah reload penuh; bookmark uji dikembalikan; chat demo memberi respons dan bertahan setelah reload; kartu chat membuka detail Kawung. Satu percakapan demo uji ditambahkan di penyimpanan browser; riwayat lama tidak dihapus. Screenshot: output/titikbatik-performance-smoke.png.
- Expo Go LAN tetap aktif pada exp://192.168.1.2:8082 dan telah direload. Browser fallback serta bundle tidak mengukur frame rate/thermal behavior iPhone; belum ada klaim peningkatan FPS perangkat.
- Expo Doctor: 20/21 lolos. Check versi mencatat patch tersedia: @expo/ui 57.0.24 → ~57.0.25, expo 57.0.29 → ~57.0.30, expo-router 57.0.27 → ~57.0.28. Dependency sengaja dipertahankan pada versi yang sudah digunakan agar scope optimasi tidak mengganti perilaku native.

## Pengukuran terbatas

- Simulasi burst 250 snapshot sebelum flush menghasilkan 1 serialisasi dan 1 penulisan, dengan isi pesan final utuh; sebelumnya effect menserialisasi setiap snapshot. Pengukuran sintetis ini bukan jumlah penulisan untuk semua pola jaringan.
- Benchmark Node Windows: merge 10.000 item + halaman 1.000 item, warm-up 3 kali, 20 iterasi. Algoritma sebelumnya 1872.73 ms, Set 13.20 ms; output identik. Ini hanya biaya fungsi di Node, bukan percepatan app atau FPS iPhone. Script tersimpan di output/mobile-performance-bench.ts.

Referensi API: https://reactnative.dev/docs/0.86/optimizing-flatlist-configuration, https://react.dev/reference/react/memo dan https://docs.expo.dev/versions/v57.0.0/sdk/image/.
