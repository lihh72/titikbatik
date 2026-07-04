# Gallery Media Carousel and Batik Slugs

## Tujuan

Merapikan tampilan detail galeri agar motif, gambar costume, dan video dapat dilihat melalui satu media viewer dengan thumbnail seragam. Mengganti URL detail berbasis ID menjadi slug permanen yang mudah dibaca.

## Ruang Lingkup

- Mengubah detail media menjadi viewer tunggal dengan thumbnail slider horizontal.
- Menambahkan slug unik pada data batik dan kontrak API publik.
- Mengubah tautan dan route detail galeri dari `/gallery/{id}` menjadi `/gallery/{slug}`.
- Mempertahankan endpoint admin berbasis ID.
- Tidak mengubah proses generate, combine, atau video.

## Desain Media Viewer

`BatikMedia` membentuk daftar media terurut dari preview motif, setiap gambar costume, dan video pasangan costume. Item menyimpan jenis media, URL, label, dan identitas stabil.

Media yang dipilih ditampilkan dalam viewport utama berasio `4:5`. Gambar menggunakan `object-contain` agar hasil tidak terpotong. Video menggunakan rasio viewport yang sama, kontrol bawaan browser, `muted`, dan `playsInline`. Video tidak autoplay ketika halaman dibuka atau ketika item lain aktif.

Di bawah viewport terdapat slider horizontal. Semua thumbnail memakai rasio `4:5` dan ukuran tetap yang sama dengan `object-cover`, sehingga gambar costume dan video tampak seragam. Thumbnail video menampilkan frame awal dan ikon putar. Item aktif mendapat penanda kontras. Tombol panah kiri dan kanan tersedia ketika daftar melampaui lebar, sedangkan sentuhan dan scroll horizontal tetap dapat digunakan pada perangkat mobile.

Jika sebuah media belum tersedia, item tersebut tidak dimasukkan ke slider. Jika seluruh media kosong, viewport menampilkan pesan bahwa media belum tersedia. Pemilihan media kembali ke item pertama ketika data batik berubah.

## Desain Slug

Tabel `batiks` mendapat kolom `slug` berupa string unik, wajib diisi, dan terindeks. Slug dibentuk dari `keyword` dengan huruf kecil, karakter nonalfanumerik diganti tanda hubung, tanda hubung berulang diringkas, dan tanda hubung di awal atau akhir dihapus.

Jika hasil slug kosong, gunakan `batik`. Jika hasil hanya berisi angka, tambahkan awalan `batik-`. Konflik diselesaikan secara berurutan dengan akhiran `-2`, `-3`, dan seterusnya. Slug bersifat permanen: perubahan metadata batik tidak otomatis mengubah URL yang sudah diterbitkan.

Migrasi Alembic menambahkan kolom secara bertahap, mengisi slug untuk seluruh data lama dalam urutan ID agar hasil deterministik, membuat indeks unik, lalu menjadikan kolom wajib. Seluruh jalur pembuatan batik, termasuk worker dan import legacy, memakai utilitas slug yang sama.

## API dan Frontend

Schema batik publik dan admin menyertakan `slug`. Endpoint publik detail menerima slug:

`GET /api/v1/batiks/{slug}`

Repository mengambil batik berdasarkan slug serta tetap memastikan data belum dihapus. Router hanya mengembalikan batik yang dipublikasikan. Endpoint daftar dan pencarian mengembalikan slug agar kartu galeri dapat langsung membuat tautan.

Endpoint admin tetap menggunakan ID numerik untuk update, hapus, publish, regenerate, dan pekerjaan internal. Ini menghindari perubahan pada kontrak operasi admin.

Route Next.js menjadi `app/(public)/gallery/[slug]/page.tsx`. `GalleryDetailPage` menerima slug tanpa konversi angka, lalu memanggil API publik berdasarkan slug. Seluruh tautan kartu galeri memakai `batik.slug`.

URL lama berbasis ID tidak dipertahankan karena kebutuhan menetapkan slug sebagai pengganti ID. URL seperti `/gallery/10` akan menghasilkan halaman batik tidak tersedia, kecuali ada batik yang memang memiliki slug `10`, yang dicegah oleh generator slug.

## Penanganan Error

- Konflik slug pada pembuatan data ditangani dengan pencarian akhiran berikutnya dan unique constraint database sebagai pengaman akhir.
- Slug yang tidak ditemukan menghasilkan respons `404 Batik not found`.
- Frontend menampilkan kondisi tidak tersedia tanpa membuka detail internal backend.
- Kegagalan memuat satu thumbnail tidak mengubah data; browser menampilkan latar media dan pengguna tetap dapat memilih item lain.

## Pengujian

- Unit test utilitas slug untuk normalisasi, teks kosong, karakter khusus, slug numerik, dan konflik berurutan.
- Migration test memastikan data lama mendapat slug unik dan kolom mempunyai unique index.
- Repository/router test memastikan detail dapat diambil melalui slug, slug tak dikenal menghasilkan 404, dan batik unpublished tidak bocor.
- Worker/import test memastikan batik baru selalu mendapat slug.
- Frontend test memastikan kartu memakai slug, halaman detail meminta slug, thumbnail memiliki dimensi seragam, pemilihan mengganti media utama, dan video tidak autoplay.
- Verifikasi visual dilakukan pada viewport desktop dan mobile untuk overflow, tombol slider, pemotongan media, serta keseragaman ukuran thumbnail.

## Kriteria Selesai

- URL detail berbentuk `/gallery/{slug}` dan tidak memakai ID batik.
- Slug unik, permanen, dan tersedia untuk data lama maupun baru.
- Motif, costume, dan video tampil dalam satu viewer.
- Semua thumbnail costume dan video memiliki ukuran serta rasio yang sama.
- Backend dan frontend test terkait lulus, serta tampilan telah diperiksa di desktop dan mobile.
