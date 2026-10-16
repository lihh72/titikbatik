# Binary hasil build — 14 Oktober 2026

Kedua build EAS selesai dengan status `FINISHED`, versi app `1.0.0` (build `1`), Expo SDK 57.

| Platform | Profil | Build | Binary |
| --- | --- | --- | --- |
| Android | `apk` | [94c1960a-b384-4133-b373-aa79e8b09605](https://expo.dev/accounts/faihilmy/projects/titikbatik-mobile/builds/94c1960a-b384-4133-b373-aa79e8b09605) | [APK](https://expo.dev/artifacts/eas/D78w57gPj-BpaoRzlppi5F1UkRDWjjjZsUgavcYOQLU.apk) |
| iPhone fisik | `ipa` | [57d4fb6a-4274-4c18-9ec5-ce43bc0104bb](https://expo.dev/accounts/faihilmy/projects/titikbatik-mobile/builds/57d4fb6a-4274-4c18-9ec5-ce43bc0104bb) | [IPA unsigned](https://expo.dev/artifacts/eas/dCwBwqmcUCjih5-Ns9sZSTMCX3CFwZAL2mG9TBTo6_g.ipa) |

Salinan lokal tersimpan pada `../output/builds/`. APK memakai keystore Android yang dihasilkan EAS. IPA dikompilasi untuk `iphoneos` tanpa signing dan harus ditandatangani melalui Sideloadly di Windows sebelum dapat dipasang. Lihat [BUILD.md](./BUILD.md) untuk alur Personal Team 7 hari.

Pemeriksaan arsip lokal: APK memuat AndroidManifest.xml, classes.dex dan 23 library ARM64; IPA memuat `Payload/TitikBatik.app/TitikBatik` (Mach-O ARM64) serta Info.plist, tanpa embedded.mobileprovision. Arsip dapat dibuka dengan pembaca ZIP.

| File | Byte | SHA-256 |
| --- | ---: | --- |
| TitikBatik-1.0.0.apk | 111075418 | `c7ff89cc696aca5ea7add0a9b44a872e61b7da1da58285705f555a808482a815` |
| TitikBatik-1.0.0-unsigned.ipa | 17079166 | `75e675f6826b0fb960cca533ea5968650f45e9986cf2b9b0317ed18d0f7b8dfe` |

Link artefak EAS memiliki masa simpan; metadata build mencantumkan kedaluwarsa 28 Oktober 2026. Simpan salinan binary lokal untuk penggunaan selanjutnya. Selesainya kompilasi belum menggantikan pemeriksaan pemasangan dan interaksi pada perangkat.
