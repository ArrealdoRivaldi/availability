# Troubleshooting Guide

## Data Tidak Muncul

Jika data users tidak muncul di tabel, ikuti langkah-langkah troubleshooting berikut:

### 1. Periksa Console Browser
- Buka Developer Tools (F12)
- Lihat tab Console untuk error messages
- Periksa tab Network untuk request Firebase

### 2. Periksa Debug Panel
- Gunakan panel "Debug Information" di halaman
- Klik "Test Connection" untuk memverifikasi koneksi
- Periksa status koneksi dan error messages

### 3. Kemungkinan Penyebab dan Solusi

#### A. Firebase Connection Issues
**Gejala:** Error "Failed to fetch users" atau "Connection failed"
**Solusi:**
- Periksa konfigurasi Firebase di `firebaseConfig.ts`
- Pastikan API key dan project ID benar
- Periksa apakah project Firebase aktif

#### B. Firestore Security Rules
**Gejala:** Error "Permission denied" atau "Missing or insufficient permissions"
**Solusi:**
- Update Firestore rules di Firebase Console
- Gunakan rules berikut untuk testing:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // WARNING: Only for testing!
    }
  }
}
```

#### C. Collection Tidak Ada
**Gejala:** "No users found" tanpa error
**Solusi:**
- Buat collection "users" di Firestore Console
- Atau gunakan tombol "Add Test User" untuk membuat data pertama

#### D. Authentication Issues
**Gejala:** Error "User not authenticated"
**Solusi:**
- Pastikan user sudah login ke Firebase Auth
- Periksa status authentication di Firebase Console

### 4. Langkah-langkah Verifikasi

#### Step 1: Test Basic Connection
```javascript
// Di browser console
import { db } from './firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const usersRef = collection(db, 'users');
getDocs(usersRef).then(snapshot => {
  console.log('Users count:', snapshot.size);
  snapshot.forEach(doc => {
    console.log('User:', doc.id, doc.data());
  });
});
```

#### Step 2: Check Firestore Console
- Buka [Firebase Console](https://console.firebase.google.com)
- Pilih project Anda
- Buka Firestore Database
- Periksa apakah collection "users" ada
- Periksa apakah ada documents di collection

#### Step 3: Verify Security Rules
- Di Firebase Console, buka Firestore Database
- Klik tab "Rules"
- Pastikan rules mengizinkan read/write access

### 5. Common Error Messages

| Error Message | Penyebab | Solusi |
|---------------|----------|---------|
| "Failed to fetch users" | Koneksi Firebase gagal | Periksa konfigurasi dan network |
| "Permission denied" | Security rules terlalu ketat | Update Firestore rules |
| "Collection not found" | Collection belum dibuat | Buat collection atau gunakan Add Test User |
| "User not authenticated" | Belum login ke Firebase | Implement authentication |

### 6. Testing dengan Data Dummy

Jika collection kosong, gunakan fitur "Add Test User":
1. Klik tombol "Add Test User" 
2. Periksa apakah user berhasil ditambahkan
3. Refresh halaman untuk melihat data

### 7. Logging dan Debug

Sistem sudah dilengkapi dengan logging yang detail:
- Console logs untuk setiap operasi Firebase
- Debug panel dengan informasi koneksi
- Error messages yang informatif

### 8. Support

Jika masalah masih berlanjut:
1. Periksa semua log di console
2. Screenshot error messages
3. Periksa status Firebase project
4. Pastikan semua dependencies terinstall dengan benar

## Checklist Troubleshooting

- [ ] Console browser tidak ada error
- [ ] Firebase project aktif dan konfigurasi benar
- [ ] Firestore rules mengizinkan read/write
- [ ] Collection "users" ada di Firestore
- [ ] User sudah authenticated (jika diperlukan)
- [ ] Network connection stabil
- [ ] Debug panel menunjukkan koneksi berhasil
