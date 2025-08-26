# Cell Down Data Management System

Sistem manajemen data cell down yang terintegrasi dengan Firebase Firestore untuk monitoring dan tracking masalah jaringan seluler.

## Fitur Utama

### 1. Upload Data Excel
- **Format yang didukung**: .xlsx, .xls
- **Preview data** sebelum upload
- **Chunk processing** untuk data besar
- **Progress bar** real-time
- **Validasi format** otomatis

### 2. Tabel Data
- **Pagination** dengan load more
- **Sorting** berdasarkan tanggal pembuatan
- **Filter** berdasarkan status (open/close)
- **Search** dan filtering lanjutan
- **Responsive design** untuk mobile dan desktop

### 3. Edit Data
- **Modal edit** untuk kolom yang dapat diedit
- **Dropdown options** untuk kategori tertentu
- **Auto-save** ke Firestore
- **Validation** input fields

### 4. Export Data
- **Export ke Excel** dengan format yang rapi
- **Filter export** berdasarkan status
- **Auto-sizing columns** untuk readability
- **Timestamp** dalam nama file

### 5. Template Excel
- **Download template** dengan format yang benar
- **Sample data** untuk referensi
- **Instructions worksheet** dengan detail kolom
- **Formatted headers** dan styling

## Struktur Data

### Collection: `data_celldown`

#### Kolom Upload (18 kolom):
1. **Week** - Nomor minggu (contoh: 34)
2. **Regional** - Regional identifier (contoh: REGIONAL8)
3. **Site ID** - ID site unik (contoh: BPP011)
4. **Alarm Source** - Sumber alarm (contoh: E_BPP011M41_KEMENDUR)
5. **NOP** - Network Operation Center (contoh: NOP BALIKPAPAN)
6. **District Operation** - District operation center (contoh: TO BALIKPAPAN)
7. **First Occurred On** - Waktu pertama terjadi (contoh: 18/08/2025 00:11)
8. **AGING DOWN** - Nilai aging down (contoh: 88)
9. **RANGE AGING DOWN** - Range aging down (contoh: 8-30 Days)
10. **Ticket ID** - ID ticket support (contoh: EM-20250818-00000297)
11. **Alarm Name** - Nama alarm (contoh: CELL LOGICAL CHANNEL AVAILABILITY SUPERVISION)
12. **SITE CLASS** - Klasifikasi site (contoh: BRONZE)
13. **Sub Domain** - Sub domain (contoh: 4G)
14. **Alarm Severity** - Severity level (contoh: Critical)
15. **Alarm Location Info** - Info lokasi detail (contoh: OFFICEID:304007;...)
16. **remark_redsector** - Remark red sector (contoh: 3. Green Sector)
17. **Remark Site** - Remark site (contoh: Belum Perpanjangan)
18. **Cell Down Name** - Nama cell down (contoh: COH709MR1_COMBATPANTAIMANGGARMR02)

#### Kolom Edit (8 kolom):
19. **Root Cause** - Penyebab utama (Hardware, Power, Transport, Comcase, Dismantle, Combat Relocation, IKN)
20. **Detail Problem** - Detail masalah (free text)
21. **Plan Action** - Rencana aksi (free text)
22. **Need Support** - Kebutuhan support (free text)
23. **PIC Dept** - Department PIC (ENOM, NOP, NOS, SQA, CTO, RTPD, RTPE)
24. **Progress** - Progress (OPEN, DONE)
25. **Closed Date** - Tanggal closed (dd/mm/yyyy)
26. **Status** - Status otomatis (open/close berdasarkan progress)

#### Kolom System (2 kolom):
27. **createdAt** - Tanggal pembuatan record
28. **updatedAt** - Tanggal update terakhir

## Cara Penggunaan

### 1. Upload Data
1. Klik tombol **"Choose Excel File"**
2. Pilih file Excel (.xlsx atau .xls)
3. Sistem akan memproses dan menampilkan preview
4. Review data di preview dialog
5. Klik **"Confirm Upload"** untuk menyimpan ke database

### 2. Download Template
1. Klik tombol **"Download Template"**
2. Template akan di-download dengan format yang benar
3. Isi data sesuai dengan template
4. Upload file yang sudah diisi

### 3. Edit Data
1. Klik tombol **Edit** (ikon pensil) pada baris data
2. Modal edit akan terbuka
3. Isi field yang diperlukan
4. Klik **"Save Changes"** untuk menyimpan

### 4. View Detail
1. Klik tombol **View** (ikon mata) pada baris data
2. Dialog detail akan terbuka menampilkan semua informasi
3. Data dikelompokkan berdasarkan kategori

### 5. Export Data
1. Klik tombol **"Export Data"**
2. Pilih format export (All, Open Only, Closed Only)
3. Klik **"Export to Excel"**
4. File akan di-download dengan nama yang sesuai

## Format Excel yang Diharapkan

### Header Row (Baris 1):
- Harus berisi nama kolom yang tepat
- Urutan kolom harus sesuai dengan struktur data
- Tidak boleh ada spasi atau karakter khusus di header

### Data Rows (Baris 2+):
- Data dimulai dari baris kedua
- Semua kolom wajib diisi
- Format tanggal: DD/MM/YYYY HH:mm
- Format angka: angka murni (bukan text)

## Validasi Data

### Otomatis:
- Format file (.xlsx, .xls)
- Jumlah kolom (18 kolom)
- Tipe data (number untuk week dan aging down)
- Required fields

### Manual:
- Review preview sebelum upload
- Edit data setelah upload jika diperlukan
- Update status dan progress secara berkala

## Performance & Scalability

### Chunk Processing:
- Upload dalam batch 100 records
- Delay 100ms antar batch untuk mencegah overload
- Progress bar real-time

### Pagination:
- Load 50 records per halaman
- Load more button untuk data tambahan
- Optimized queries dengan Firestore

### Caching:
- Data disimpan di local state
- Auto-refresh setelah update
- Efficient re-rendering dengan React

## Troubleshooting

### Upload Gagal:
- Pastikan format file benar (.xlsx, .xls)
- Pastikan jumlah kolom 18
- Pastikan header row ada dan benar
- Check console untuk error detail

### Data Tidak Muncul:
- Refresh halaman
- Check koneksi internet
- Check Firebase console untuk data
- Verify collection name `data_celldown`

### Edit Tidak Tersimpan:
- Pastikan semua field required terisi
- Check koneksi internet
- Verify Firebase permissions
- Check console untuk error

## Security & Permissions

### Firebase Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /data_celldown/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### User Authentication:
- Login required untuk akses
- Role-based access control berdasarkan user role
- Audit trail untuk semua perubahan

### Role-Based Access Control:

#### Super Admin (`super_admin`):
- ✅ Upload data Excel
- ✅ Download Excel template
- ✅ Edit data (kolom edit)
- ✅ Export data ke Excel
- ✅ View data detail
- ✅ Delete data (jika diperlukan)

#### Regular Users (non-super_admin):
- ❌ Upload data Excel
- ✅ Download Excel template
- ✅ Edit data (kolom edit)
- ✅ Export data ke Excel
- ✅ View data detail
- ✅ Browse data table

#### Role Management:
- Role disimpan di `localStorage` dengan key `userRole`
- Role `super_admin` memberikan akses penuh
- Role lainnya hanya memberikan akses read-only
- Role dapat diubah oleh administrator sistem

## Maintenance

### Regular Tasks:
- Monitor Firebase usage
- Backup data secara berkala
- Update dependencies
- Performance monitoring

### Data Cleanup:
- Archive old records
- Remove duplicate entries
- Validate data integrity
- Update status yang expired

## Support & Contact

Untuk bantuan teknis atau pertanyaan:
- Check dokumentasi ini
- Review console errors
- Contact development team
- Submit issue report

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Technology Stack**: Next.js, React, Material-UI, Firebase Firestore, ExcelJS
