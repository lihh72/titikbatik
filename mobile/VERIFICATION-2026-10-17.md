# Refresh, carousel dan boot motion — 17 Oktober 2026

- RefreshControl sekarang menerima state refreshing yang dinyalakan langsung dalam onRefresh, sesuai kontrak controlled React Native. Loading awal/paginasi tidak menyalakan refresh. Indikator dipertahankan minimal 600 ms, dibersihkan ketika request selesai/error, dan timer dibatalkan saat effect cleanup. Refresh tidak menghapus query/kategori/layout. Native iOS memakai inset otomatis; offset tambahan hanya untuk fallback Android.
- Referensi slider: https://uob-forms.krome.sg/image-slider. Kapsul diletakkan di bawah hero, berisi chevron, dots, dan play/pause. Marker aktif berubah 8→32 pt lalu terisi terracotta selama 3 detik; dot tidak aktif putih. CTA dan thumbnail mendapat ruang di atas kapsul. Warna/identitas TitikBatik dipertahankan.
- Manual navigation membatalkan callback timer sebelumnya dan memberikan durasi penuh. Gesture swipe menahan autoplay sampai momentum selesai, dengan fallback settlement untuk gesture tanpa momentum event. Pause mempertahankan sisa waktu; background, blur tab, Reduce Motion dan boot overlay menghentikan autoplay.
- BootEntrance menampilkan BrandTitle dengan scale/translate pendek, kemudian membuka app. State selesai dimiliki RootLayout, sehingga remount scope data/pindah mode tidak mengulang motion. Tidak menyimpan flag permanen di AsyncStorage: cold boot berikutnya tetap menjalankan entrance. Reduce Motion memakai perpindahan langsung. Tidak mengubah native splash plugin atau header detail hitam transparan.

## Hasil pemeriksaan

- TypeScript dan lint lulus.
- 26 tes lulus; regression clock diperbarui untuk interval 3 detik, countdown penuh tiap slide, pause/resume dan pembatalan callback lama.
- Ekspor iOS lulus: 1735 modul, 37 aset.
- Preview browser 393×852: kapsul tidak menutupi CTA; pause, previous, loop first→last, dan autoplay last→first teruji. Reload penuh kembali ke katalog tanpa overlay macet. Ganti tab Tersimpan lalu Koleksi tidak mengulang boot overlay. Preview disimpan di output/titikbatik-slider-motion-preview.png.
- Browser adalah fallback, bukan bukti visual GlassView, UIRefreshControl atau motion UIKit pada perangkat. Pull-to-refresh native, gesture momentum iPhone, cold boot/resume fisik dan Reduce Motion tetap perlu diperiksa di Expo Go iOS.
- Metro Expo Go aktif di exp://192.168.1.2:8082.

Referensi API: https://reactnative.dev/docs/0.86/refreshcontrol dan https://docs.expo.dev/versions/v57.0.0/sdk/router/.

## Revisi loop, refresh dan detail

- Refresh iOS menampilkan ActivityIndicator dalam awal konten; tinggi mengikuti overscroll dan state refreshing. Spinner RefreshControl transparan; gesture tetap native. Posisi fisik indikator di iPhone masih perlu diverifikasi. Worklet hanya menangkap shared value pull, bukan objek handler native.
- LoopCarousel digunakan bersama hero dan detail, dengan halaman salinan pada kedua ujung dan rebasing tanpa animasi setelah momentum selesai.
- Dots/countdown, prev/next, pause/resume dan thumbnail detail tetap sinkron. Kapsul di bawah media tidak menutupi kontrol video. Autoplay berhenti pada video; video tetap manual.
- Browser: prev dari slide pertama ke terakhir, next kembali ke pertama, dots detail dan thumbnail Costume 1 teruji. Screenshot: output/titikbatik-detail-dots-preview.png. Gesture native iPhone belum diverifikasi.
- TypeScript, lint dan 26 tes lolos. Ekspor iOS: 1736 modul, 37 aset. Metro LAN merespons packager-status:running dan HTTP 200 pada port 8082.

## Revisi kedip saat membuka detail

- Cache per adapter menyediakan data list/demo secara sinkron melalui peek; detail tetap melakukan revalidasi dan menampilkan error server. Cache tidak menyeberang mode/alamat server; response abort tidak mengganti data. Detail tidak mengosongkan konten yang sudah tersedia saat request berjalan.
- Galeri detail menerima lebar awal dan tinggi media tetap. FlatList sudah terpasang pada render pertama, tanpa scrollToOffset kedua saat mount. Clipping dinonaktifkan untuk media pager; image memakai memory-disk dan transition 0.
- Browser: membuka Teratai lereng dari kartu langsung menampilkan motif, judul dan metadata; dots/thumbnail tetap tersedia. Screenshot output/titikbatik-detail-stable-preview.png. Transisi fisik iPhone masih perlu dinilai di perangkat.
- TypeScript, lint, 29 tes dan ekspor iOS (1737 modul, 37 aset) lolos. Metro telah direload.

- Posisi refresh direvisi atas permintaan pengguna: indikator iOS kini overlay di tengah area navigasi (safe-area top + 8), di atas search bar, tanpa menambah tinggi header konten. Spinner native tetap transparan. Posisi fisik perlu dicek di iPhone.

- Refresh berikutnya: indikator hanya dipasang ketika refreshing=true, bukan berdasarkan overscroll. Gesture yang tidak mencapai refresh tidak menampilkan spinner. Overlay dipindahkan ke bawah wordmark besar (safe-area top + 92), di atas search; pengukuran pull yang dapat tertahan oleh perubahan inset dihapus. TypeScript/lint lolos; posisi visual perlu diperiksa pada iPhone.

- Preview refresh diaktifkan kembali sesuai permintaan: spinner muncul selama drag aktif melewati resting inset + 8 pt. onEndDrag/onMomentumBegin/onMomentumEnd, touch-end dan touch-cancel menghapus preview; sisa overscroll setelah jari dilepas tidak mempertahankan spinner. Refresh nyata tetap memakai state request. Posisi antara logo dan search tidak diubah. Gerakan native tetap perlu dicoba pada iPhone.

- Fade preview dikoreksi: opacity spinner mengikuti jarak overscroll selama drag (0–1), bukan animasi keluar 180 ms setelah unmount. Tarikan kembali memudarkan spinner sebelum refresh; refresh nyata mengunci opacity 1. Release/cancel mengosongkan nilai preview dan menghentikan animating apabila tidak refreshing. TypeScript/lint lolos; Expo Go direload.

- Arah fade preview dibalik mengikuti koreksi pengguna: opacity 1-progress selama tarik, bukan progress. Rentang tarikan 80 pt setelah dead zone 8 pt. Saat refresh aktif opacity kembali 1. TypeScript/lint lolos, Expo Go direload; gerakan visual native belum diverifikasi langsung.

- Fade preview dikembalikan ke opacity=progress. State preview dipindah ke CatalogRefreshIndicator supaya gesture feedback tidak merender ulang katalog/native search. Pengguna mengonfirmasi logo compact terlalu tinggi dibanding tombol kanan: compactOffsetY=6 menurunkan logo secara bertahap saat mengecil, posisi logo besar tetap. TypeScript/lint dicek; alignment visual iPhone perlu dikonfirmasi pada perangkat.

## Rollback header/refresh sesuai permintaan

CatalogScreen, useHeaderScroll, HeaderTitle dan CatalogWordmark dikembalikan persis ke HEAD dd3fbae (sebelum rangkaian revisi refresh). CatalogRefreshIndicator dihapus. Native RefreshControl asli kembali dipakai, tanpa overlay/fade preview atau offset logo compact 6 pt. Carousel infinite, dots detail, boot entrance dan perbaikan cache/galeri detail tetap dipertahankan. Catatan revisi refresh sebelumnya di dokumen ini adalah riwayat, bukan perilaku aktif.

## Stabilitas header pada cold boot

- useAccessibility kini memakai satu AccessibilityProvider: Reduce Motion/Transparency dibaca sebelum navigator dipasang. Semua header, tab shell dan Glass memakai snapshot yang sama, tanpa pergantian headerTransparent true/false terpisah selama mount awal. Subscription live tetap aktif dan dibersihkan saat unmount; event yang datang selama initial read lebih diutamakan daripada hasil read lama.
- BootEntrance tidak lagi memberi transform pada ancestor native navigator. Animasi pembuka tetap berjalan pada overlay/brand; UIKit menghitung safe area/header/search dari container yang tidak bergerak sejak frame pertama.
- Tidak mengubah offset logo, font, desain header atau implementasi refresh yang baru di-rollback.
- TypeScript, 29 tes dan ekspor iOS (1738 modul, 37 aset) lolos. Alignment cold boot/compact header fisik iPhone belum dapat diverifikasi dari Windows; perlu dibandingkan sebelum/sesudah perpindahan tab pada Expo Go.

## Penyelarasan refresh native setelah cold boot diperbaiki

- Native UIRefreshControl dipertahankan dengan tint p.soft dan gaya preview UIKit. progressViewOffset=24 pada iOS menggeser spinner turun, tanpa mengubah posisi logo/search/header. Implementasi RN 0.86 Fabric yang terpasang diverifikasi menerapkan offset melalui bounds UIRefreshControl. Posisi akhir tetap perlu dilihat langsung di iPhone.
- State refreshing terpisah langsung diset pada onRefresh; lifecycle request mengakhirinya dengan minimum 600 ms agar demo instan sempat berputar. Timer dibersihkan saat request dibatalkan/unmount; query/source baru meneruskan penyelesaian refresh. Pagination ditahan selama refreshing. Tidak ada overlay, fade kustom atau perubahan geometri header.

## Optimasi performa tanpa perubahan animasi

Lihat PERFORMANCE-2026-10-17.md. Context dipisah, derivasi grid/hero dimemoisasi, Markdown lama dimemoisasi, merge pagination linear, dan buffer preference chat 250 ms dengan flush lifecycle. 36 tes, lint, TypeScript dan ekspor iOS lolos; 10 hash file motion identik. Expo Doctor 20/21: tiga patch versi Expo tersedia, dependency tidak diganti. Browser smoke bookmark/chat persistence/detail lolos.

## Alpha 0.1.0-alpha.1 dan splash menyambung

- Optimized snapshot dimerge ke main setelah fetch/pull. Snapshot final dan optimized tetap terpisah.
- Package dan label Pengaturan memakai 0.1.0-alpha.1; versi native 0.1.0/build 1.
- Konfigurasi splash native dipertahankan: logo 100 pt di tengah latar hitam. Overlay React memakai frame awal yang sama dan menunggu onDisplay sebelum melepaskan splash, lalu menganimasikan logo. Tidak ada pembuka wordmark kedua.
- Overlay berjalan selama hydration; navigator tetap menunggu preferensi aksesibilitas dan data lokal. Ancestor navigator tidak ditransformasi. Reveal menunggu data siap, tanpa countdown kedua jika hydration lambat. Reduce Motion melewati motion/hold.
- TypeScript, lint, 39 tes dan ekspor iOS lolos. Belum diverifikasi secara visual pada perangkat release fisik; splash Expo Go berbeda dari release. Tidak membuat IPA baru sesuai instruksi pengguna.
