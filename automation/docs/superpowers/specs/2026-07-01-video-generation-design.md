# Video Generation Design

## Tujuan

Menambahkan pembuatan video otomatis ke Titik Batik dengan urutan satu motif batik, satu hasil combine costume, dan satu video bisu. Video selalu memakai gambar hasil combine sebagai input dan diproses oleh durable worker yang sama dengan job generate dan combine.

## Alur

1. Admin membuat generation batch dengan `combine_enabled=true` dan `video_enabled=true`.
2. Batch memilih tepat satu costume template.
3. Worker menyelesaikan job `generate` dan membuat satu data batik.
4. Worker membuat tepat satu job `combine` untuk batik tersebut.
5. Worker menyelesaikan combine, menyimpan satu costume file, lalu membuat tepat satu job `video` yang menunjuk costume file tersebut.
6. Worker mengunggah gambar costume ke ComfyUI, menjalankan workflow video, mengunduh file video, dan menyimpannya ke `storage/output/video`.
7. Nama video dicatat pada costume file dan disalin ke `batiks.file_video` agar API kompatibilitas lama tetap bekerja.

Jika `video_enabled=false`, alur generate dan combine yang sekarang tetap berlaku. Jika `video_enabled=true`, permintaan batch yang tidak mengaktifkan combine atau memilih lebih dari satu costume template ditolak dengan pesan validasi yang jelas.

## Workflow ComfyUI

Workflow sumber adalah `workflows/videobatik.json` dalam format API prompt. Backend memvalidasi node dan class berikut sebelum mengirim workflow:

- Node `269`: `LoadImage`, input gambar costume.
- Node `320:312`: `PrimitiveInt`, lebar output.
- Node `320:299`: `PrimitiveInt`, tinggi output.
- Node `320:310`: `CreateVideo`, penyusun video tanpa audio.
- Node `75`: `SaveVideo`, penyimpan output.

Backend hanya mengubah:

- `269.inputs.image` menjadi nama gambar costume yang telah diunggah ke ComfyUI.
- `320:312.inputs.value` menjadi `512`.
- `320:299.inputs.value` menjadi `512`.
- Menghapus `320:310.inputs.audio` agar file akhir tidak mempunyai audio stream.
- `75.inputs.filename_prefix` menjadi prefix unik per job.

Node AV internal LTX tetap dipertahankan karena merupakan bagian dari graph model. Audio hanya dilepas dari node pembentuk file video sehingga hasil akhir selalu bisu. Pengaturan model, prompt, sampler, frame rate, durasi, LoRA, dan parameter lain tetap mengikuti workflow sumber.

## Data

`generation_batches` memperoleh kolom `video_enabled` bertipe boolean. Nilai ini juga dicatat dalam `settings_json` batch.

`generation_jobs` memperoleh kolom nullable `source_costume_file_id` yang mengarah ke `batik_costume_files.id`. Job dengan `job_type="video"` menyimpan `source_batik_id`, `source_costume_file_id`, nama input costume, `workflow_name="videobatik"`, `comfyui_prompt_id`, status, retry, lock, dan nama output seperti job lain.

`batik_costume_files` memperoleh kolom `file_video` nullable agar pasangan costume-video tidak ambigu. `batiks.file_video` tetap digunakan sebagai mirror untuk response API lama.

Migration baru mengubah database yang sudah ada tanpa menghapus data sebelumnya.

## API

`POST /api/admin/generation-batches` menerima `video_enabled`. Untuk batch video, API memvalidasi bahwa combine aktif dan tepat satu template akan dipakai.

`POST /api/admin/batiks/{batik_id}/regenerate-video` membuat ulang video dari satu-satunya costume aktif milik batik. Permintaan ditolak jika costume belum tersedia atau lebih dari satu costume membuat sumber tidak pasti.

Response batik admin menyertakan URL video pada pasangan costume. Endpoint file yang sudah ada, `/api/v1/images/video/{filename}` dan `/api/image/{filename}`, melayani video dengan content type yang sesuai.

## Worker dan Recovery

Worker menangani tipe job `video` setelah generate dan combine. Sebelum submit, worker mengunggah gambar costume dan membangun prompt melalui `WorkflowService`.

ComfyUI client membaca metadata output video dari history node `75` dan mengunduhnya melalui `/view`. Penyimpanan video memvalidasi nama file, ekstensi, ukuran minimum, dan signature/container sebelum atomic rename ke direktori video.

Job video memakai mekanisme yang sudah ada untuk claim transactional, retry/backoff, stale-lock recovery, heartbeat, cancel batch, retry failed, dan resume berdasarkan `comfyui_prompt_id`. Jika ComfyUI mati setelah prompt diterima, worker mencari prompt pada history atau queue sebelum memutuskan untuk submit ulang.

## Admin Web

Form generate memperoleh kontrol `Video` aktif/mati. Saat video aktif, UI membatasi pemilihan model menjadi satu dan mengirim `video_enabled=true`.

Halaman hasil menampilkan video bisu dengan kontrol play di bawah pasangan preview motif dan costume. Jika video belum selesai, UI menampilkan status pemrosesan tanpa menghilangkan gambar costume.

## Penanganan Error

- Workflow yang kehilangan node atau mempunyai class yang berbeda gagal sebelum dikirim ke ComfyUI.
- Batch video tanpa satu costume template ditolak sebelum job dibuat.
- Output tanpa metadata video, file kosong, ekstensi tidak didukung, atau container tidak valid membuat job retry atau failed sesuai jumlah percobaan.
- File parsial ditulis di temporary storage dan tidak dipublikasikan.
- Kegagalan video tidak menghapus motif atau costume yang sudah berhasil.

## Pengujian

- Workflow video hanya mengganti input image, ukuran 512x512, prefix, dan menghapus output audio.
- Batch video menghasilkan rasio job `1 generate : 1 combine : 1 video`.
- Validasi menolak video tanpa combine dan pemilihan template yang tidak tepat satu.
- Worker video menangani sukses, ComfyUI offline, timeout, retry, resume history/queue, serta stale lock.
- Output disimpan atomically dan file tidak valid ditolak.
- API admin, API kompatibilitas, dan URL video mengembalikan data yang benar.
- Admin web mengirim pengaturan video dan menampilkan hasil costume-video.
