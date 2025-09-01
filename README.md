# Dokumentasi Proyek Aplikasi Pelabelan Pakaian (PWA)

## 1. Ikhtisar Proyek

Proyek ini adalah sebuah Progressive Web App (PWA) yang berfungsi sebagai galeri pakaian digital. Pengguna dapat mengunggah gambar pakaian, memberikan label, dan menyimpannya. Aplikasi ini dibangun dengan HTML, CSS, dan JavaScript vanilla, serta memanfaatkan Firebase (Firestore) sebagai backend untuk penyimpanan data. Lingkungan pengembangan dikelola secara deklaratif menggunakan file `.idx/dev.nix`.

Tujuan utama proyek ini adalah menciptakan aplikasi yang cepat, andal, dan dapat diinstal di berbagai perangkat (desktop dan mobile) layaknya aplikasi native.

---

## 2. Komponen Sistem dan Review Kode

Berikut adalah rincian setiap file dalam proyek, fungsinya, dan review singkat.

### a. `InputImage.html`
- Fungsi: Merupakan file utama yang menjadi antarmuka pengguna (UI). File ini berisi struktur HTML untuk menampilkan area unggah gambar, kolom input label, tombol simpan, dan galeri gambar yang sudah tersimpan.
- Review: Strukturnya logis dan menggunakan tag HTML semantik. Penggunaan `div` dengan class yang jelas (`container`, `upload-section`, `gallery`) memudahkan styling dan manipulasi DOM. Elemen input dan tombol memiliki ID yang jelas untuk interaksi dengan JavaScript. (Kode ditulis manual oleh pengguna dengan bantuan AI).

### b. `.idx/style.css`
- Fungsi: Berisi semua aturan styling (CSS) untuk memberikan tampilan visual pada `InputImage.html`. Ini mencakup layout, warna, tipografi, dan desain responsif.
- Review: Kode CSS terorganisir dengan baik, menargetkan class dan ID yang didefinisikan di HTML. Desainnya fungsional dan bersih. (Kode dihasilkan oleh AI berdasarkan deskripsi).

### c. `app.js` (Sebelumnya `.idx/skrip.js`)
- Fungsi: Ini adalah otak dari aplikasi. File ini menangani semua logika frontend, termasuk:
    1.  Pratinjau Gambar: Menampilkan gambar yang dipilih pengguna sebelum diunggah.
    2.  Konversi Gambar: Mengubah file gambar menjadi format Base64 agar dapat disimpan sebagai string di Firestore.
    3.  Validasi Input: Memastikan pengguna telah memilih gambar dan mengisi label sebelum menyimpan.
    4.  Interaksi Firestore: Menyimpan data (gambar Base64 dan label) ke Firestore saat tombol "Simpan" diklik dan mengambil data untuk ditampilkan di galeri.
    5.  Pembaruan UI Dinamis: Menambahkan item baru ke galeri secara real-time setelah berhasil disimpan.
- Review: Logika kode terstruktur dengan baik. Fungsi-fungsi dipisahkan berdasarkan tugasnya. Penggunaan `async/await` untuk operasi Firestore adalah praktik terbaik. Sistem pesan status (`showStatus`) memberikan umpan balik yang jelas kepada pengguna. (Kode dihasilkan oleh AI berdasarkan spesifikasi fungsional).

### d. `.idx/dev.nix`
- Fungsi: File konfigurasi untuk lingkungan pengembangan di Firebase Studio. File ini memastikan bahwa setiap anggota tim memiliki lingkungan yang identik.
- Isi Konfigurasi:
    - `channel`: Menggunakan `stable-24.05` untuk paket Nix.
    - `packages`: Menginstal `python3` (untuk server lokal) dan `firebase-cli` (untuk deployment).
    - `previews`: Mengkonfigurasi server web Python sederhana untuk menjalankan dan menguji aplikasi secara lokal.
- Review: Konfigurasi ini sangat efisien untuk pengembangan web statis. Ini menunjukkan praktik terbaik dalam mendefinisikan lingkungan pengembangan yang reproduktif. (Kode dihasilkan oleh AI).

### e. `firebase.json` & `.firebaserc`
- Fungsi: Mengkonfigurasi Firebase Hosting.
    - `.firebaserc`: Menghubungkan direktori proyek dengan ID proyek Firebase ("wardobeapp").
    - `firebase.json`: Menentukan bahwa direktori `.` adalah *public root*, mengkonfigurasi *rewrites* agar berfungsi sebagai Single-Page App (SPA), dan mengabaikan file yang tidak perlu dideploy.
- Review: Konfigurasi ini standar dan efektif untuk mendeploy PWA atau SPA ke Firebase Hosting. (Kode dihasilkan oleh AI).

### f. `.idx/manifest.json`
- Fungsi: File manifes PWA. File ini memberi tahu browser bahwa situs web ini adalah aplikasi yang dapat diinstal. Ini mendefinisikan nama aplikasi, ikon, `start_url`, dan bagaimana aplikasi harus ditampilkan.
- Review: Konfigurasi manifes sudah benar dan mencakup informasi dasar yang diperlukan agar PWA dapat diinstal. (Kode ditulis manual oleh pengguna).

---

## 3. Integrasi Frontend dengan Firebase

Koneksi antara frontend (JavaScript) dan layanan Firebase (Firestore) adalah inti dari fungsionalitas aplikasi ini.

### Alur Koneksi dan Implementasi:

1.  Inisialisasi Firebase: Di dalam `app.js`, konfigurasi Firebase (API key, project ID, dll.) digunakan untuk menginisialisasi aplikasi Firebase dengan memanggil `initializeApp(firebaseConfig)`.

2. Akses ke Firestore: Setelah inisialisasi, kita mendapatkan referensi ke layanan Firestore dengan `getFirestore(app)`.

3.  Menyimpan Data (Create):
    - Ketika pengguna menekan tombol "Simpan", sebuah event listener akan terpicu.
    - Gambar yang sudah diubah ke format Base64 dan teks dari input label dikumpulkan.
    - Fungsi `addDoc(collection(db, "wardrobe"), { ... })` dari Firebase SDK dipanggil.
    - `addDoc` secara asynchronous mengirimkan data ini untuk membuat dokumen baru di dalam koleksi bernama `wardrobe` di Firestore.

    Contoh Kode (`app.js`):
    ```javascript
    // Dihasilkan oleh AI
    import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

    // ... di dalam event listener tombol simpan
    await addDoc(collection(db, "wardrobe"), {
      imageBase64: currentBase64,
      label: labelInput.value.trim(),
      timestamp: new Date().toISOString()
    });
    ```

4.  Membaca Data (Read):
    - Saat halaman dimuat, fungsi `loadGallery()` dipanggil.
    - Fungsi `getDocs(collection(db, "wardrobe"))` digunakan untuk mengambil semua dokumen dari koleksi `wardrobe`.
    - Hasilnya (sebuah `querySnapshot`) di-loop untuk mengakses setiap dokumen.
    - Data dari setiap dokumen (`doc.data()`) digunakan untuk secara dinamis membuat elemen HTML (gambar dan label) dan menampilkannya di galeri.

---

## 4. Pembagian Tugas untuk Penjelasan Komponen

Untuk memastikan seluruh tim memahami arsitektur proyek, setiap anggota diminta untuk menjelaskan salah satu komponen berikut:

1.  Alur Kerja Frontend (`app.js`): Menjelaskan bagaimana proses dari pengguna memilih gambar hingga gambar tersebut ditampilkan di galeri, termasuk validasi dan interaksi DOM.
2.  Integrasi Firestore: Menjelaskan bagaimana `app.js` berkomunikasi dengan Firebase, mencakup proses inisialisasi, penulisan (`addDoc`), dan pembacaan (`getDocs`) data.
3.  Konfigurasi PWA dan Deployment: Menjelaskan peran `manifest.json`, `firebase.json`, dan `.firebaserc`. Menunjukkan alur dari kode di lokal hingga bisa diakses publik melalui Firebase Hosting.
4.  Lingkungan Pengembangan (`.idx/dev.nix`): Menjelaskan bagaimana file Nix ini bekerja untuk menciptakan lingkungan pengembangan yang konsisten dan mengapa ini penting untuk kolaborasi tim.