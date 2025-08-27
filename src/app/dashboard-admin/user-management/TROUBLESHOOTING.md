# Troubleshooting Guide

## Data Tidak Muncul

Jika data users tidak muncul di tabel, ikuti langkah-langkah troubleshooting berikut:

### 1. Periksa Console Browser
- Buka Developer Tools (F12)
- Lihat tab Console untuk error messages
- Periksa tab Network untuk request Firebase

### 2. Kemungkinan Penyebab dan Solusi

#### A. Firebase Connection Issues
**Gejala:** Error "Failed to fetch users" atau "Connection failed"
**Solusi:**
- Periksa konfigurasi Firebase di `firebaseConfig.ts`
- Pastikan API key dan project ID benar
- Periksa apakah project Firebase aktif

#### B. Firestore Security Rules - SUPER ADMIN ONLY
**Gejala:** Error "Permission denied" atau "Missing or insufficient permissions"
**Solusi:**
- **HANYA SUPER ADMIN** yang bisa mengakses menu User Management
- Pastikan user yang login memiliki role `super_admin`
- Update Firestore rules di Firebase Console dengan rules berikut:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only super_admin users can access the users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
    }
    
    // Allow read access to all collections for authenticated users
    match /{document=**} {
      allow read: if request.auth != null;
    }
  }
}
```

#### C. Collection Tidak Ada
**Gejala:** "No users found" tanpa error
**Solusi:**
- Buat collection "users" di Firestore Console
- Pastikan ada minimal satu user dengan role `super_admin`

#### D. Authentication Issues
**Gejala:** Error "User not authenticated"
**Solusi:**
- Pastikan user sudah login ke Firebase Auth
- Pastikan user memiliki role `super_admin`
- Periksa status authentication di Firebase Console

### 3. Langkah-langkah Verifikasi

#### Step 1: Check User Role
- Pastikan user yang login memiliki role `super_admin`
- Periksa di Firebase Console > Authentication > Users

#### Step 2: Check Firestore Console
- Buka [Firebase Console](https://console.firebase.google.com)
- Pilih project Anda
- Buka Firestore Database
- Periksa apakah collection "users" ada
- Periksa apakah ada documents dengan role `super_admin`

#### Step 3: Verify Security Rules
- Di Firebase Console, buka Firestore Database
- Klik tab "Rules"
- Pastikan rules mengizinkan akses hanya untuk `super_admin`

### 4. Common Error Messages

| Error Message | Penyebab | Solusi |
|---------------|----------|---------|
| "Failed to fetch users" | Koneksi Firebase gagal | Periksa konfigurasi dan network |
| "Permission denied" | User bukan super_admin | Login dengan user super_admin |
| "Collection not found" | Collection belum dibuat | Buat collection "users" |
| "User not authenticated" | Belum login ke Firebase | Implement authentication |

### 5. NOP Options yang Tersedia

Sistem sekarang mendukung kota-kota di Kalimantan:
- **Kalimantan** (umum)
- **Balikpapan**
- **Banjarmasin**
- **Palangkaraya**
- **Pangkalan Bun**
- **Pontianak**
- **Samarinda**
- **Tarakan**

### 6. Role-based Access Control

- **Super Admin**: Akses penuh ke semua fitur user management
- **Admin**: Akses terbatas (sesuai kebutuhan)
- **User**: Akses terbatas (sesuai kebutuhan)

### 7. Support

Jika masalah masih berlanjut:
1. Periksa semua log di console
2. Screenshot error messages
3. Periksa status Firebase project
4. Pastikan user memiliki role `super_admin`
5. Pastikan semua dependencies terinstall dengan benar

## Checklist Troubleshooting

- [ ] Console browser tidak ada error
- [ ] Firebase project aktif dan konfigurasi benar
- [ ] User yang login memiliki role `super_admin`
- [ ] Firestore rules mengizinkan akses super_admin
- [ ] Collection "users" ada di Firestore
- [ ] Network connection stabil
- [ ] Authentication berhasil
