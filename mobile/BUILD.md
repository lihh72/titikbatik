# APK dan IPA dari Windows

Project EAS: https://expo.dev/accounts/faihilmy/projects/titikbatik-mobile

## Build cloud

Jalankan dari folder `mobile`. CLI menggunakan akun Expo yang sudah login. Variabel berikut membatasi archive yang diunggah ke folder app ini; `.easignore` mengecualikan dependency lokal, output bundle, environment lokal, dan file signing.

```powershell
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = (Get-Location).Path
npx.cmd --yes eas-cli@24.13.0 build --platform android --profile apk
npx.cmd --yes eas-cli@24.13.0 build --platform ios --profile ipa
```

- `apk`: Android release APK dengan signing keystore EAS, bisa dipasang langsung. Tidak memerlukan Metro.
- `ipa`: **IPA unsigned untuk iPhone fisik**, dikompilasi di macOS EAS memakai custom workflow `.eas/build/ios-unsigned.yml`. Tidak menggunakan simulator, sertifikat Apple berbayar, atau Apple ID saat build. Perlu signing lokal sebelum dapat dijalankan.
- `ipa-internal`: alternatif ad-hoc dengan Apple Developer Program berbayar dan perangkat terdaftar.
- `ipa-store`: alternatif untuk TestFlight/App Store; memerlukan signing distribusi Apple. Build tidak otomatis mengirim ke App Store.

Hasil build diunduh dari halaman build EAS. Mode awal tetap demo; aset dan JavaScript sudah disertakan dalam APK/IPA. Koneksi backend dapat diatur setelah app terpasang.

## Signing gratis 7 hari dan pemasangan iPhone

1. Unduh IPA unsigned yang selesai dibuat.
2. Pasang [Sideloadly dari situs resmi](https://sideloadly.io/) di Windows beserta dependency Apple yang diminta situs tersebut.
3. Sambungkan iPhone melalui USB, pilih Trust pada iPhone, lalu pilih perangkat di Sideloadly.
4. Masukkan IPA ke Sideloadly. Masuk menggunakan Apple ID Anda langsung di aplikasi itu, lalu jalankan signing/pemasangan. Jangan menaruh Apple ID, password, atau kode 2FA dalam repository.
5. Selesaikan trust Developer App dan Developer Mode di iPhone jika diminta iOS.
6. Untuk Personal Team gratis, provisioning berlaku 7 hari; refresh/re-sign sebelum kedaluwarsa. Apple ID dan proses signing dilakukan pengguna di Windows. File dari EAS tetap unsigned sampai langkah ini selesai.

Referensi: [Apple — Personal Team dan provisioning 7 hari](https://developer.apple.com/help/account/basics/about-your-developer-account), [Sideloadly](https://sideloadly.io/), [custom EAS builds](https://docs.expo.dev/custom-builds/get-started/).

## Batas pemeriksaan

Bundle JavaScript Android/iOS yang lulus ekspor bukan APK/IPA. Hanya hasil kompilasi native EAS yang selesai dan artefaknya dapat diunduh yang dihitung sebagai binary. Workflow IPA unsigned harus lulus kompilasi macOS; signing 7 hari dan instalasi perlu diverifikasi pada iPhone pengguna.
