# Revamp beranda — 15 Oktober 2026

Referensi pengguna diterapkan pada komposisi banner, kategori horizontal, kartu bergambar tinggi, dan tombol bookmark di atas gambar. Latar hitam, teks paper, aksen terracotta, native tabs, toolbar iOS, dan haptik dipertahankan. Tidak menambahkan harga, keranjang, atau akun pengguna fiktif.

- Hero memakai motif dan costume dari sumber katalog aktif. Kategori berasal dari gaya pada halaman awal yang dimuat, tanpa daftar gaya atau jumlah kategori fiktif.
- Preview web 390 × 844: kategori Geometris menghasilkan Kawung dan Kupu-kupu; pencarian `teratai` mengganti kategori; memilih gaya kembali mengosongkan pencarian. Bookmark overlay berubah tanpa membuka detail dan dikembalikan ke keadaan awal setelah tes.
- Kartu “Lihat busana Teratai lereng” membuka `/batik/9?media=costume-0`, menampilkan Costume 1 / media kedua langsung.
- TypeScript, lint, dan 16 tes lulus. Bundle iOS berhasil diekspor dengan 36 aset.
- Metro Expo Go aktif pada `exp://192.168.1.2:8082`, manifest LAN terkonfirmasi SDK 57. iPhone perlu berada pada jaringan yang sama. Preview web tidak menggantikan pemeriksaan visual dan interaksi native iPhone.

APK dan IPA di `BUILD-RESULTS.md` adalah snapshot build 14 Oktober, sebelum revamp ini. Perubahan terbaru tersedia melalui Metro/Expo Go; binary lama tidak berubah otomatis.

## Perbaikan kontrol, pencarian, dan preview

- Header sekarang berada di luar daftar virtual. Mengubah dua/tiga kolom tidak mengganti key atau membongkar seluruh FlatList; baris diatur ulang dengan animasi layout iOS. Reduce Motion mematikan animasi.
- Tombol kanan atas tetap terpasang. Ikon menu/tutup memakai transisi rotasi dan opacity pada ikon, tanpa memberi opacity nol pada permukaan GlassView. Pemilih kolom memakai indikator geser. GlassView menggunakan skema gelap dan permukaan interaktif; Reduce Transparency memakai fallback solid.
- Input pencarian React Native dikontrol langsung oleh state. Preview web: `teratai` menyisakan Teratai lereng dan Teratai; `zzztidakada` menampilkan hasil kosong; menghapus pencarian mengembalikan tujuh motif. Kontrol kanan atas tetap tersedia selama pencarian dan pergantian kolom.
- Logo asli digunakan bersama wordmark serif paper/terracotta. Identitas warna tetap dipertahankan.
- Kartu dua kolom sekarang memakai Link.Trigger, Link.Preview, dan Link.Menu yang sama dengan kartu tiga kolom di iOS. Berlaku juga pada kartu Tersimpan. Bookmark overlay tetap menjadi tombol terpisah.
- Log iPhone saat preview memperlihatkan peringatan konfigurasi navigation bar. Detail sekarang memeriksa `useIsPreview()` sebelum memasang Stack.Screen/Stack.Toolbar, sehingga preview tidak mencoba mengubah header stack induk.
- Pemeriksaan otomatis: 17 tes lulus, termasuk pengelompokan baris tanpa motif hilang/terduplikasi, TypeScript dan lint lulus. Ekspor iOS berhasil dengan 1.718 modul dan 37 aset.
- Enam dependency Expo diselaraskan ke patch SDK 57 melalui `expo install --fix`; Expo Doctor lulus 21/21. TypeScript, lint, 17 tes, dan ekspor iOS dijalankan ulang setelah pembaruan.
- Metro dimulai ulang dengan cache bersih pada alamat yang sama dan koneksi debugger Expo Go iPhone terdeteksi. Animasi Liquid Glass, haptik fisik, dan preview tekan lama belum diverifikasi secara visual pada perangkat; hasil browser hanya memverifikasi fallback serta perilaku filter/layout.

## Header bersama antar-tab dan material blur

- Header dipindahkan ke `TabChromeShell`, di luar navigator tab, untuk mempertahankan satu kapsul GlassView dan satu tombol aksi saat Tersimpan/Asisten berganti. Ikon gear/trash bertransisi dengan opacity/rotasi pada isi tombol saja; permukaan glass dan ancestor-nya tidak diberi opacity nol. Judul tab juga bertransisi. Tab aktif terakhir dipertahankan saat detail/modal terbuka.
- `expo-blur` dipasang melalui `expo install` dan tersedia di Expo Go. Blur header dirender setelah konten dinamis. List/ScrollView memakai padding konten untuk posisi awal, sehingga konten tetap bisa bergerak di bawah overlay ketika digulir. Search memakai GlassView, bukan bidang solid di iOS yang mendukung.
- Detail memakai native `headerTransparent` + `headerBlurEffect: systemChromeMaterialDark`; scroll edge effects diset hidden untuk menghindari efek bertumpuk. Native toolbar/back tetap digunakan. Root route `(tabs)` memiliki judul TitikBatik dan detail mempunyai back title TitikBatik; menu riwayat native tidak dimatikan.
- Panel layout sekarang absolute overlay, bukan baris yang mengubah tinggi viewport daftar. Batas hit test overlay ikut diperluas ketika panel terbuka, agar tombol di bawah search bisa ditekan pada iOS. LayoutAnimation diganti dengan Reanimated LinearTransition pada baris dan sel. Warna filter dianimasikan; slot tombol “Lihat semua” tetap dicadangkan agar heading tidak melompat.
- Filter tidak lagi mengosongkan grid sebelum hasil baru datang. Mode/sumber yang berbeda tetap mengosongkan data lama. Preview: Geometris menghasilkan Kawung dan Kupu-kupu; pergantian dua/tiga kolom dan penutupan panel berhasil.
- Preview web 390 × 844: elemen tombol header yang sama berubah dari Pengaturan menjadi Hapus riwayat saat Tersimpan → Asisten, dan kembali menjadi Pengaturan saat kembali. Pengaturan membuka `/info`; composer Asisten tetap berada dalam viewport. Riwayat chat pengguna tidak dihapus untuk tes.
- TypeScript, lint tanpa warning, 17 tes, Expo Doctor 21/21, dan ekspor iOS berhasil. Metro hidup dengan watch/live reload pada `exp://192.168.1.2:8082`. Browser memakai material solid fallback; tidak mengklaim verifikasi visual blur, animasi, atau back-menu native pada iPhone.

Dokumentasi: [GlassEffect SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/glass-effect/), [BlurView SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/blur-view/), [native stack header](https://reactnavigation.org/docs/native-stack-navigator/), [Reanimated layout transitions](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/layout-transitions/).

## Koreksi ke navigation bar UIKit dan inset detail

Bagian ini menggantikan pendekatan overlay blur penuh di atas, sesuai klarifikasi pengguna.

- Header visual React Native dan seluruh HeaderMaterial/BlurView dihapus; dependency expo-blur juga dihapus. Header tab sekarang memakai navigation bar native pada root Stack yang sama dengan Detail. Logo tetap menjadi title view di navigation bar. `TabChromeShell` hanya meneruskan tinggi bar induk ke konten, tanpa menggambar header sendiri.
- Tombol iOS memakai `unstable_headerRightItems` berupa native button/SF Symbol dengan shared background aktif. Identifier `titikbatik.primary-action` dipakai pengaturan/hapus/share, dan `titikbatik.secondary-action` dipakai menu/bookmark. Ini menggunakan API matching UIKit iOS 26, bukan rotasi ikon custom. Detail loading dan loaded mempertahankan slot serta identifier yang sama.
- Header tidak memakai `headerBlurEffect`; efek tepi scroll menggunakan native `soft`, dinonaktifkan ketika Reduce Transparency aktif. Tidak ada layer blur persegi panjang di belakang seluruh header.
- Detail mengembalikan `contentInsetAdjustmentBehavior="automatic"`; tidak lagi memakai `never` ketika header transparan. Konfigurasi geometri header berlaku sejak awal root route, bukan berubah setelah item selesai dimuat. Loading/error diberi inset yang sesuai, sedangkan preview tidak diberi inset bar tambahan.
- Preview setelah full reload: Asisten dan Tersimpan memuat tanpa error provider; tombol pengaturan/hapus tersedia. Membuka Teratai lereng dari Tersimpan menampilkan link back berlabel “Tersimpan”, serta kontrol bookmark/share dan media. Riwayat chat dan bookmark pengguna tidak dihapus.
- 19 tes lulus: dua tes baru memeriksa matching identifier antar-mode, routing callback primary/secondary, dan perubahan state loading/bookmark tanpa mengganti identifier. TypeScript, lint, Expo Doctor 21/21, dan bundle iOS berhasil. Header native, efek tekan, scroll edge effect dan fluiditas transisi belum diverifikasi secara visual pada perangkat; preview browser hanya memverifikasi fallback.
- Perubahan lokasi provider/root header membutuhkan satu full reload pada sesi Expo Go yang sebelumnya aktif. Metro tetap pada `exp://192.168.1.2:8082`.

Referensi utama: [native header items dan identifier](https://reactnavigation.org/docs/native-stack-navigator/#header-items), [native scroll edge effects](https://reactnavigation.org/docs/native-stack-navigator/#scrolledgeeffects).

## Animasi eksplisit dan perluasan frosted edge

Revisi ini menggantikan asumsi bahwa identifier native saja menghidupkan animasi setiap pembaruan ikon. Source react-native-screens yang terpasang memperbarui rightBarButtonItems melalui assignment; hal ini tidak menjamin animasi saat tab mengganti props pada navigation item yang sama.

- Navigation bar dan back tetap UIKit. Satu custom toolbar host berukuran tetap menampung GlassView native; background glass pembungkus UIKit dinonaktifkan agar tidak ada permukaan ganda. Primary/secondary slot tetap ada, dengan glyph SF Symbols yang dianimasikan eksplisit (fade/scale/spring) pada UI thread. Logo dan judul memiliki layer tetap yang bertransisi. Mode sebelumnya menjadi seed ketika header detail baru dibuat, sehingga pergantian layar tidak melewati animasi.
- Callback detail didaftarkan terpisah dari tampilan toolbar. Perubahan loading/bookmark/share tidak membongkar host. Preview tekan lama tidak mendaftarkan callback atau mengambil alih header halaman induk. Riwayat back masih memakai nama tab asal.
- Expo BlurView, LinearGradient dan MaskedView dipasang melalui expo install dengan versi SDK 57 yang tersedia di Expo Go. Native BlurView dirender sesudah setiap list/scroll view, dan di bawah search/toolbar. Mask memiliki area bar dan ekor gradient 88 pt; opacity ekor mengikuti scroll pada UI thread, mencapai penuh setelah 64 pt. Insets otomatis iOS dan padding manual list dinormalisasi agar konten awal tidak ikut kabur. Reduce Transparency mematikan layer; Reduce Motion mematikan transisi glyph/judul.
- Preview web: Tersimpan → Asisten mengganti label/aksi pada kontrol yang sama; Koleksi → detail Kawung menampilkan bookmark/share. Bookmark Kawung diuji simpan → hapus, lalu dikembalikan ke keadaan awal. Tombol kembali membawa ke katalog; bookmark dan riwayat chat pengguna tetap dipertahankan. Ikon dekoratif yang tidak aktif disembunyikan dari accessibility tree.
- 20 tes lulus, termasuk normalisasi offset header untuk inset otomatis dan manual. TypeScript, lint, Expo Doctor 21/21 dan bundle iOS lulus. Pemeriksaan browser memvalidasi fallback serta callback, bukan kualitas visual blur/animasi pada iPhone. Tidak mengklaim bahwa hasilnya telah disamakan secara visual dengan WhatsApp/Reddit atau diukur frame-rate-nya pada perangkat.

Referensi: [GlassEffect SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/glass-effect/), [BlurView SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/blur-view/), [MaskedView SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/masked-view/).

## Pemulihan header build pertama — 16 Oktober 2026

Binary IPA lokal 14 Oktober diperiksa dengan disassembler Hermes. CatalogChrome pada build tersebut menggunakan Stack.SearchBar dengan placement stacked, hideWhenScrolling=false, hideNavigationBar=false dan obscureBackground=false; judul TitikBatik dan large title aktif. Header berada di native stack tiap tab, sedangkan root route tabs tidak menampilkan header.

Struktur tersebut dipulihkan untuk iOS, termasuk native automatic scroll edge dan automatic content insets. Overlay blur manual dihapus. Komponen BrandTitle saat ini (image logo, serif paper/terracotta) dipertahankan. Input native disinkronkan dengan state pencarian dan kategori; pengaturan dua/tiga kolom memakai ActionSheetIOS. Web/Android mempertahankan fallback yang kompatibel. Pemeriksaan visual UIKit dan gerakan large title/search tetap perlu dilakukan di iPhone; hasil browser tidak membuktikan animasi native.

### Koreksi satu wordmark dan kontrol lintas-tab

Native large-title text kini tidak digambar; UIKit hanya mencadangkan geometri large title dan search. Satu BrandTitle custom yang tetap terpasang di TabChromeShell bergerak dari posisi large title ke bar pada UI thread mengikuti offset scroll awal UIKit, sehingga tidak ada dua judul terlihat. Kontrol kanan atas juga berada pada shell yang sama, bukan instance terpisah per tab, sehingga pergantian gear/trash serta lebar kapsul kembali dianimasikan. Header detail memulai glyph/judul dari tab asal; header tab di belakang detail tetap siap saat kembali. Search dan scroll-edge material tetap native. Tidak mengklaim verifikasi visual iPhone dari tes atau ekspor bundle.

### Native title fallback dan transisi kembali

Placeholder whitespace dihapus. Native title view memakai View kosong nyata, karena callback yang mengembalikan null dapat memicu fallback judul UIKit. Wordmark tetap satu; large-title text sistem transparan hanya mencadangkan geometri search/scroll. Judul Tersimpan/Asisten memiliki posisi dan ukuran tetap selama crossfade; hanya layer logo katalog mengikuti scroll.

Satu HeaderActions kini berada di root di atas navigator, sehingga tetap terpasang dari tab ke detail dan kembali. Mode tujuan back dipilih sejak transitionStart(closing); pop sukses mempertahankan mode tersebut sampai route segments menyusul, sedangkan gestureCancel memulihkan mode detail. Ini menghindari swap balik sesaat saat transitionEnd mendahului pembaruan route. Root native back dan search controller tetap digunakan.

### Proporsi dan perpindahan judul lintas-tab

Koleksi, Tersimpan, dan Asisten kini memiliki geometri large title native yang sama. Shared title memakai leading alignment dengan lebar mengikuti viewport, bukan memusatkan teks dalam kotak wordmark 168 pt. Judul halaman memakai system font semibold 32 pt saat expanded dan 17 pt saat compact, dengan line-height/letter-spacing mengikuti posisi header. Wordmark dan image logo tetap memakai BrandTitle yang sama.

Setiap tab menyimpan SharedValue scroll sendiri. Saat berpindah tab, posisi title dimulai dari pose yang sedang terlihat lalu diinterpolasi 300 ms ke posisi scroll tab tujuan; perubahan scroll langsung mengikuti gesture pada UI thread. Crossfade 170/210 ms memakai easing tanpa spring vertikal. Asisten kosong tidak lagi scrollToEnd saat mount, sehingga tidak otomatis mengecilkan header sebelum pengguna berinteraksi. Perubahan ini tidak mengubah kontrol kanan atas atau mekanisme native back yang sudah dipulihkan.

### Judul halaman ikut konten scroll

Sesuai klarifikasi terbaru, large title/collapsing wordmark hanya digunakan di Koleksi. Judul Tersimpan berada di ListHeaderComponent biasa (tanpa stickyHeaderIndices), dan Asisten berada di dalam ScrollView. Keduanya bergulir keluar bersama konten dan tidak digambar lagi pada shared header. Hanya tombol aksi kanan atas yang tetap tersedia. SharedValue scroll Tersimpan/Asisten dihapus dari chrome; callback posisi chat tetap bekerja.

### Perpindahan large wordmark ke judul konten

Offset tambahan 20 pt di Tersimpan dan 16 pt di Asisten dihapus pada iOS. Keduanya kini mulai pada leading inset 16 pt dan posisi awal area judul di bawah compact navigation bar, selaras dengan posisi expanded wordmark Koleksi. PageHeading memakai focus fade (delay 70 ms, masuk 220 ms, keluar 120 ms) yang berpasangan dengan fade wordmark shared chrome. Judul tetap menjadi konten scroll biasa, tanpa stickyHeaderIndices atau large-title mode pada tab tersebut. Intro Asisten juga dirapikan agar tidak menyisakan ruang berlebihan di bawah judul. Reduce Motion memakai pergantian opacity langsung. Ini memperbaiki perpindahan geometri dan bukan sekadar memperpanjang durasi animasi logo.

### Tersimpan ↔ Asisten

Perpindahan langsung kedua tab memakai fade 220 ms tanpa delay pada scroll content, sementara PageHeading tidak menambah fade kedua. Konten tab yang tidak fokus disiapkan transparan untuk menghindari satu frame penuh lalu mendadak hilang saat event focus tiba. Native header, root GlassView dan composer Asisten tidak menjadi ancestor yang dianimasikan opacity-nya. Jalur dari Koleksi tetap memakai timing PageHeading 70/220 ms yang sudah diterima pengguna. Heading kedua halaman mempunyai subtitle satu baris dan jarak yang sama, termasuk ketika bookmark kosong.

### Hapus fade tab dan pertahankan pencarian — 16 Oktober 2026

Fade scroll content Tersimpan/Asisten dihapus. PageHeading langsung opacity 1 pada perpindahan kedua tab tersebut; perpindahan dari Koleksi dan kontrol kanan atas tetap memakai perilaku sebelumnya.

Pemilihan kategori tidak lagi menghapus query, dan pengetikan tidak lagi melepas kategori. Callback Stack.SearchBar stabil agar perubahan hasil/jumlah kolom tidak mengganti opsi search native pada setiap render. Setelah ActionSheet ditutup, teks UIKit disinkronkan kembali. Pencarian + kategori diiriskan tanpa mengubah kontrak server: semua halaman hasil query dibaca sebelum penyaringan kategori dan dipaginasi lokal; hasil irisan dicache untuk halaman berikutnya dan dibatalkan saat request dibatalkan. Pull-to-refresh menghapus cache.

TypeScript, lint, 26 tes, dan ekspor bundle iOS lulus (1733 modul, 37 aset). Tes baru mencakup irisan lintas halaman, pencarian saat kategori dilepas, kategori tanpa query, hasil kosong, cache paginasi, dan pembatalan tanpa cache parsial. Verifikasi visual UIKit/gesture pada iPhone tetap memerlukan pemeriksaan perangkat.

### Judul tanpa fade dan scroll edge detail — 16 Oktober 2026

PageHeading sekarang View biasa tanpa useIsFocused, opacity, delay, atau timing. Pengecualian fade bersyarat sebelumnya dihapus seluruhnya, sehingga judul Tersimpan/Asisten tidak menunggu sinkronisasi route/focus. Kontrol kanan atas tetap memakai transisi glyph yang terpisah.

Detail mempertahankan ScrollView yang sama sejak loading, error, retry hingga data tampil. Sebelumnya early return Status membuat ScrollView tidak ada ketika native screen terpasang. Source react-native-screens SDK terpasang menghubungkan scrollEdgeEffects ke ScrollView pertama saat mounting/controller attachment atau pembaruan props screen; penggantian isi belakangan tidak menjamin efek dihubungkan ulang. ScrollView detail kini tetap berada di hierarchy awal, memakai automatic content insets dan scroll indicator insets, tanpa padding header manual pada loading. Konfigurasi top automatic milik root stack tetap digunakan sebagaimana Koleksi; tidak menambahkan BlurView atau bidang blur berbatas.

Referensi: https://docs.expo.dev/versions/v57.0.0/sdk/router/stack/ dan implementasi lokal RNSScreen.mm/RNSScrollViewFinder.mm/RNSScrollEdgeEffectApplicator.mm. TypeScript, lint, 26 tes dan ekspor iOS (1733 modul, 37 aset) lulus. Expo Go menerima perintah reload. Kualitas visual native scroll edge tetap belum diverifikasi langsung pada iPhone.

### Hilangkan fade wordmark/judul dan ruang hitam header detail — 16 Oktober 2026

Layer judul HeaderTitle sekarang View dengan visibility langsung, tanpa opacity timing/delay atau seed logo katalog pada header detail. Transform posisi/skala wordmark saat scroll dipertahankan; transisi kontrol kanan atas terpisah.

Detail iOS transparan tidak lagi menggeser media ke bawah navigation bar melalui inset otomatis: konten media dimulai di belakang header. Loading/error tetap memiliki jarak aman dari kontrol. Reduce Transparency memakai inset otomatis dan permukaan solid. Pager horizontal menonaktifkan penyesuaian inset sendiri, dan gambar contain diratakan ke atas agar letterbox hitam tidak mengisi area belakang header. Motif tetap tampil utuh tanpa crop. Root detail memilih native top scroll edge soft agar tepi kabur tidak berbentuk bidang dengan batas tegas; tidak memakai BlurView manual.

Referensi SDK 57: https://docs.expo.dev/versions/v57.0.0/sdk/router/stack/ dan https://docs.expo.dev/versions/v57.0.0/sdk/image/. TypeScript dan 26 tes lulus. Expo Go menerima reload. Pemeriksaan visual blur harus tetap dilakukan pada iPhone.
Lint dan ekspor iOS juga selesai dengan exit code 0 (1733 modul, 37 aset).

### Judul terikat native tab dan blur penuh navigation bar — 16 Oktober 2026

CatalogWordmark dipindahkan dari TabChromeShell (di luar native navigator) ke CatalogScreen sendiri. Visibility sekarang mengikuti container native tab, bukan pembaruan useSegments. Tidak ada pending tab state, timer, atau fade untuk menyembunyikan judul. Scroll tetap mengubah ukuran/posisi logo yang sama, dan kontrol kanan atas tetap berada di root.

Header detail menambahkan headerBlurEffect systemUltraThinMaterialDark pada navigation bar transparan agar material mencakup seluruh area back/title/action. Native soft scroll edge tetap digunakan untuk kelanjutan tepi bawah. Ini kombinasi dua efek native yang sengaja melengkapi cakupan; dokumentasi Expo mencatat kemungkinan overlap, sehingga tingkat blur/penyatuan tepi tetap perlu diperiksa langsung di iPhone. Tidak ada BlurView overlay manual, solid header background, shadow pembatas, atau perubahan crop gambar.

Referensi: https://docs.expo.dev/router/advanced/stack/; implementasi UIKit RNSScreenStackHeaderConfig.mm; NativeBottomTabsNavigator.js. TypeScript dan 26 tes lulus. Pemeriksaan visual native belum dilakukan dari perangkat fisik.
Lint dan ekspor iOS lulus (1734 modul, 37 aset). Expo Go sudah direload. Log SDK menampilkan warning overlap blurEffect/scrollEdgeEffects sebagaimana dokumentasi; ini bukan error bundle, tetapi hasil gabungan material/edge belum dapat dinyatakan lolos visual tanpa iPhone.

### Koreksi kembali ke progressive scroll edge native — 16 Oktober 2026

Menghapus headerBlurEffect systemUltraThinMaterialDark dari detail: material navigation bar biasa bukan progressive scroll edge yang diminta. Detail kembali mewarisi konfigurasi root top automatic, headerTransparent dan background transparent yang sama dengan TabStack Koleksi. Tidak ada blur ganda atau bidang material tambahan.

ScrollView detail tetap terpasang sejak loading, tetapi contentInsetAdjustmentBehavior sekarang selalu automatic. Menghapus pergantian never/automatic setelah pemeriksaan aksesibilitas asinkron, penonaktifan otomatis inset, dan padding header bersyarat. Ini memulihkan geometri safe area UIKit sekaligus menghindari perpindahan offset ketika properti berubah setelah mount. Media contain kembali memakai posisi tengah semula dan tidak dipaksa ke atas di belakang navigation bar. Pager horizontal tetap tanpa penyesuaian inset untuk menghindari inset bertumpuk.

Perubahan judul Koleksi yang sudah berada dalam layar native tab dipertahankan. Pemeriksaan visual progressive edge dan posisi media pada iPhone masih perlu dilakukan; ekspor bundle tidak membuktikan penampilan native.
TypeScript, lint, dan ekspor iOS lulus (1734 modul, 37 aset).

### Cakupan blur detail mengikuti tinggi header — 16 Oktober 2026

Pengaturan scrollEdgeEffects bawaan hanya mengekspos automatic/soft/hard/hidden, bukan tinggi cakupannya. Revisi ini mengganti edge detail dengan DetailHeaderBackdrop: BlurView UIKit yang sudah tersedia di Expo Go, memakai alpha mask progressive. Ini rekonstruksi visual menggunakan blur native, bukan API UIScrollEdgeEffect milik header Koleksi; tidak diklaim sebagai variable-radius blur native iOS 26.

Area penuh mencakup max(useHeaderHeight(), safeArea.top + 44) ditambah 8 pt; baru sesudah seluruh bar tertutup mask memudar selama 80 pt. Layer dirender setelah ScrollView dan di belakang native title/back serta root actions. Pointer events dan accessibility dinonaktifkan pada backdrop. Teks, tombol, dan glass controls tidak ikut diblur. Opacity backdrop mengikuti scroll UI-thread dengan baseline inset otomatis, mencapai penuh setelah 32 pt; pada posisi awal gambar tetap di bawah header. Reduce Transparency memakai fallback solid header. Native scroll edge detail disembunyikan untuk menghindari efek bertumpuk. HeaderBlurEffect tetap tidak digunakan. Inset dan posisi media tidak diubah.

TypeScript, lint, 26 tes dan ekspor iOS lulus (1741 modul, 37 aset). Metro dihentikan lalu dijalankan ulang dengan cache bersih pada port/LAN URL yang sama. Tampilan blur native serta performa di iPhone masih belum diverifikasi secara langsung.

Referensi SDK 57: https://docs.expo.dev/versions/v57.0.0/sdk/blur-view/, https://docs.expo.dev/versions/v57.0.0/sdk/masked-view/, https://docs.expo.dev/versions/v57.0.0/sdk/linear-gradient/.

### Detail memakai native large title dan scroll edge sistem — 16 Oktober 2026

Menghapus DetailHeaderBackdrop sepenuhnya, termasuk mask, BlurView, alpha scroll dan SharedValue khusus backdrop. Detail tidak lagi menjalankan onScroll JS/worklet untuk blur: ScrollView biasa dengan automatic content insets memberi UIKit kendali atas scroll/title/edge effect.

Header detail sekarang memakai headerLargeTitleEnabled pada iOS, sebagaimana Koleksi. Judul Detail karya adalah judul UIKit asli (32 pt semibold saat expanded, compact ketika di-scroll), bukan React headerTitle overlay. Top scroll edge kembali automatic yang diwarisi dari root; header transparan, shadow dimatikan, tanpa headerBlurEffect atau material buatan. Ini perubahan struktur header compact menjadi native large-title untuk menyamakan perilaku sistem, bukan klaim bahwa tampilan telah dibandingkan langsung pada perangkat. Native search bar masih khusus Koleksi. Detail mempunyai ruang large-title asli; gambar tetap utuh dengan automatic inset, tanpa offset manual atau pemaksaan media ke belakang bar.

Kontrol kanan atas tetap pada host root dan transisi bookmark/share/back sebelumnya dipertahankan. Judul tab tetap tanpa custom fade. TypeScript dan 26 tes lulus; pengujian visual iPhone tetap diperlukan.
Lint dan ekspor iOS lulus (1734 modul, 37 aset). Metro aktif pada exp://192.168.1.2:8082 dan menerima perintah Reloading apps.

### Pulihkan hanya gaya header detail — 16 Oktober 2026

Sesuai koreksi pengguna, large-title native pada detail dibatalkan. Detail kembali compact dengan HeaderTitle sebelumnya; tombol root dan tata letak media tetap. Top automatic scroll edge sistem tetap dipakai. Tidak menambahkan lagi material bar atau mask blur sebagai pengganti yang diklaim identik.

Cakupan native di atas custom overlay tidak dapat diatur melalui scrollEdgeEffects pada dependency Expo Go SDK 57 terpasang: API hanya mengekspos style/hidden. Apple menyediakan UIScrollEdgeElementContainerInteraction untuk mengaitkan shape efek dengan container tombol/label; modul native untuk API tersebut tidak ada di dependency terpasang/Expo Go. Memakai kontrol ini membutuhkan modul native dan development build. Kecocokan cakupan blur compact detail dengan Koleksi masih belum terselesaikan; perubahan large title sebelumnya bukan penyelesaian yang sesuai permintaan pengguna.

Referensi: https://developer.apple.com/documentation/uikit/uiscrolledgeelementcontainerinteraction?changes=_2_6 dan react-native-screens/src/types.tsx serta ios/helpers/scroll-view/RNSScrollEdgeEffectApplicator.mm. TypeScript dan lint lulus. Metro menerima perintah reload.

### Pulihkan native toolbar detail seperti build pertama — 16 Oktober 2026

Perbandingan binary IPA lokal menunjukkan Detail membentuk Stack.Toolbar placement=right dengan tombol bookmark/share. Revisi ini memulihkan native toolbar itu pada iOS dan menyembunyikan overlay HeaderActions root ketika route batik aktif. UIKit kembali memiliki kontrol kanan atas sebagai bar button items di navigation bar yang menaungi progressive scroll edge. Header tetap compact dengan HeaderTitle yang sama; automatic scroll edge/insets dan posisi media dipertahankan. Tidak ada large title detail, headerBlurEffect, atau mask blur manual.

Toolbar terpasang sejak loading (disabled sampai data/media siap). Bookmark membaca preferences yang sama, share memakai fungsi shareMedia yang sama, dan haptik tetap dipanggil. Link preview tidak memasang toolbar/action registry. Web/Android mempertahankan fallback HeaderActions. Kontrol lintas-tab tetap memakai host sebelumnya; perpindahan detail memakai toolbar UIKit sehingga kualitas transisi native dan cakupan blur harus diperiksa di iPhone.

TypeScript dan 26 tes lulus. Native toolbar merupakan perbedaan yang terkonfirmasi terhadap binary pertama; belum ada pengukuran visual perangkat yang membuktikan bahwa perbedaan ini satu-satunya penyebab cakupan blur sebelumnya.
Lint dan ekspor iOS juga lulus (1734 modul, 37 aset). Metro menerima Reloading apps pada exp://192.168.1.2:8082.

### Bar hitam transparan detail sesuai revisi pengguna — 16 Oktober 2026

Pengguna membatalkan percobaan progressive blur detail dan meminta bar hitam transparan. Header detail kini memakai background #000000b3 (sekitar 70% hitam) pada iOS dengan transparansi diizinkan; Reduce Transparency memakai hitam solid. Top scroll edge detail dimatikan. Tidak memakai BlurView, mask, atau headerBlurEffect. Compact HeaderTitle, automatic content insets dan posisi gambar dipertahankan.

Percobaan Stack.Toolbar detail dibatalkan. Bookmark/share kembali ke HeaderActions root yang sebelumnya dipakai, dengan callback detail didaftarkan lagi untuk iOS. Kontrol yang sama tetap terpasang dari tab ke detail dan kembali. Header Koleksi tidak diubah. TypeScript dan lint lulus; perintah reload dikirim ke Expo Go.
