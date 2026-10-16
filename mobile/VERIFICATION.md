# Verifikasi implementasi — 14 Oktober 2026

Environment: Windows, Node 25.1.0, Expo SDK 57. Log pemeriksaan berasal dari app `mobile`; web dan backend lama tidak diubah.

| Pemeriksaan | Hasil |
| --- | --- |
| TypeScript (`npm run typecheck`) | Lulus |
| ESLint (`npm run lint`) | Lulus tanpa warning |
| Unit tests (`npm test`) | 16/16 lulus |
| Expo Doctor | 21/21 lulus |
| Ekspor bundle iOS setelah perbaikan menu dan haptik | Lulus; 1.394 modul, bundle Hermes sekitar 2,9 MB, 36 aset |
| Kompatibilitas dependency setelah `expo install expo-haptics` | `expo install --check` lulus |
| Binary EAS Android APK | Build `94c1960a-b384-4133-b373-aa79e8b09605` selesai `FINISHED` |
| Binary EAS iOS IPA unsigned | Build `57d4fb6a-4274-4c18-9ec5-ce43bc0104bb` selesai `FINISHED`; arsip memuat executable ARM64 dan Info.plist, tanpa embedded.mobileprovision |
| Preview web 390 × 844, tema gelap | Palet identitas web, pengantar + sorotan terracotta, grid dua/tiga kolom dengan judul. Sorotan membuka detail Teratai lereng; pencarian `geometris` menghasilkan dua motif dan menyembunyikan pengantar. UIKit/SwiftUI tidak dirender oleh browser |
| Paginasi | Demo tujuh karya satu halaman; adapter pagination backend dan guard pemuatan berikutnya dipertahankan |
| Pencarian demo | `geometris` memberi dua hasil pada katalog baru |
| Bookmark / layout Tersimpan | Preview web: dua kartu tampil dengan ukuran gambar normal; hapus Kawung memperbarui daftar menjadi satu kartu, reload mempertahankan Teratai lereng, dan kartu membuka detail. Native Link.Trigger sekarang memakai Link asChild agar kartu tidak terbungkus Text |
| Media | Costume dapat dipilih; video lokal berdurasi 4,84 detik terbaca dan paused sebelum pengguna menekan play |
| Chat demo | Respons berlabel simulasi dan kartu Batik #9 tampil |
| Diagnosis runtime iPhone / Expo Go | `AbortSignal.throwIfAborted` terkonfirmasi undefined. Setelah diganti helper portabel, adapter demo pada runtime iPhone berhasil memuat 7 motif dan detail Kawung dengan 2 media |

Test otomatis mencakup kontrak API publik/envelope, normalisasi URL termasuk origin localhost, metadata/media opsional, search/pagination, error JSON/network/abort, URL kartu chat, namespace storage, SSE CRLF/chunk terpotong termasuk UTF-8, error stream, dan pelepasan reader saat pembatalan.

Regresi Expo Go iOS: pemeriksaan pembatalan memakai `signal.aborted` melalui `assertNotAborted`, bukan metode Web AbortSignal yang tidak tersedia di React Native. Dua tes tambahan menguji signal tanpa `throwIfAborted`/`reason` serta konsumsi dan pembatalan SSE dengan API signal native yang lebih kecil.

UI iOS memakai nested native stack per tab, UIKit large title/search bar, native toolbar/menu SF Symbols, context-menu preview dari Expo Router, serta SwiftUI Form/Picker/TextField dalam pengaturan. Detail kini memakai ScrollView paging native dengan ukuran media eksplisit, thumbnail, judul besar, metadata dua kolom, dan disclosure prompt. Latar utama seluruh app hitam, teks paper dan aksen terracotta tetap dipertahankan. Tujuh aset demo mengikuti pemetaan `batik_id` database lokal. Route `/collection` tetap redirect ke `/`.

Test struktur native memindai JSX untuk mencegah literal text children di container React Native serta Link.Trigger dengan pembungkus Text yang dapat merusak layout kartu iOS.

Menu titik tiga katalog sekarang memakai toolbar button dengan handler eksplisit dan ActionSheetIOS, menggantikan Toolbar.Menu. Tiga tes haptik menguji penggabungan handler berdekatan, lingkungan nonaktif, dan kegagalan native sinkron/asinkron. Haptik memakai modul Expo Go SDK 57; action sheet dan sensasi hardware masih memerlukan pemeriksaan interaksi di iPhone.

## Batas verifikasi

- Pemeriksaan adapter melalui debugger runtime iPhone sudah dilakukan; pemeriksaan visual dan interaksi lengkap belum dilakukan. Liquid Glass, gesture, keyboard dengan safe area native, photo picker/HEIC, share sheet, perubahan aksesibilitas, serta lifecycle video native perlu checklist perangkat di README.
- Backend asli dan provider AI tidak dijalankan untuk smoke test ini. Adapter diuji menggunakan response fixture; percakapan preview memakai mode demo.
- Preview web memakai navigasi web dan fallback solid; screenshot tidak membuktikan rendering Liquid Glass native.
- `npm audit` melaporkan 30 temuan dependency pada graph bawaan SDK/tooling (12 moderate, 18 high). Ini terpisah dari pemeriksaan kompatibilitas Expo Doctor. Tidak memakai `npm audit fix --force`, karena saran resolusinya mencakup downgrade Expo/RN yang merusak target SDK 57. Temuan dependency masih memerlukan evaluasi sebelum distribusi production.
