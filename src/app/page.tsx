'use client';
import React, { useState } from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { setDoc as setDocFS } from "firebase/firestore";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 1. Cek dokumen dengan ID = user.uid
      const userDocRef = doc(db, "users", user.uid);
      let userDoc = await getDoc(userDocRef);
      let userData;

      if (userDoc.exists()) {
        // User sudah sinkron, lanjutkan
        userData = userDoc.data();
      } else {
        // 2. Cek dokumen lain dengan email yang sama
        const q = query(collection(db, "users"), where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Ambil data user lama
          const oldDoc = querySnapshot.docs[0];
          const oldData = oldDoc.data();

          // Buat dokumen baru dengan ID = user.uid, copy data lama
          await setDoc(userDocRef, { ...oldData, email: user.email });

          // Hapus dokumen lama jika ID-nya bukan user.uid
          if (oldDoc.id !== user.uid) {
            await deleteDoc(doc(db, "users", oldDoc.id));
          }

          // Ambil ulang data user yang sudah sinkron
          userDoc = await getDoc(userDocRef);
          userData = userDoc.data();
        } else {
          setError("Akses ditolak. User belum terdaftar.");
          setLoading(false);
          return;
        }
      }

      // Role check dan redirect
      if (!userData) {
        setError("Akses ditolak. Data user tidak ditemukan.");
        setLoading(false);
        return;
      }
      if (userData.role === "super_admin") {
        if (typeof window !== 'undefined') {
          localStorage.setItem('userRole', 'super_admin');
          localStorage.removeItem('hideApprovalMenu');
        }
        // Logging user aktif ke Firestore
        await setDocFS(doc(db, "active_users", user.uid), {
          email: user.email,
          displayName: user.displayName || '',
          lastLogin: new Date().toISOString(),
          role: userData.role,
        });
        router.push("/dashboard-admin");
      } else if (userData.role === "admin") {
        if (typeof window !== 'undefined') {
          localStorage.setItem('userRole', 'admin');
          localStorage.setItem('hideApprovalMenu', 'true');
        }
        // Logging user aktif ke Firestore
        await setDocFS(doc(db, "active_users", user.uid), {
          email: user.email,
          displayName: user.displayName || '',
          lastLogin: new Date().toISOString(),
          role: userData.role,
        });
        router.push("/dashboard-admin");
      } else {
        setError("Akses ditolak. Anda bukan admin.");
      }
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        // User menutup popup, tidak perlu tampilkan error
        setError(null);
      } else {
        setError("Gagal login: " + (err.message || ""));
      }
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f7fafd",
      }}
    >
      <Box
        sx={{
          background: "#fff",
          borderRadius: 4,
          boxShadow: "0 2px 16px 0 rgba(30,58,138,0.08)",
          p: 5,
          minWidth: 320,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <img src="/logo.png" alt="Telkomsel" style={{ height: 48, marginBottom: 24, marginTop: 8 }} />
        <Typography variant="h5" fontWeight={700} mb={3} textAlign="center" sx={{ color: '#1e293b', fontFamily: 'inherit' }}>
          Login ke Dashboard
        </Typography>
        <Button
          onClick={handleGoogleLogin}
          startIcon={<FcGoogle size={24} />}
          variant="contained"
          fullWidth
          sx={{
            bgcolor: "#ea4335",
            color: "white",
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 2,
            py: 1.5,
            mb: 1,
            boxShadow: '0 2px 8px 0 rgba(234,67,53,0.10)',
            '&:hover': { bgcolor: "#d32f2f" },
            textTransform: "none",
            letterSpacing: 0.2,
          }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Login dengan Google"}
        </Button>
        <Button
          onClick={async () => {
            try {
              // Create a temporary guest user session without Firebase authentication
              if (typeof window !== 'undefined') {
                localStorage.setItem('userRole', 'guest');
                localStorage.setItem('hideApprovalMenu', 'true');
                localStorage.setItem('isGuest', 'true');
                localStorage.setItem('guestLoginTime', new Date().toISOString());
              }
              
              // Redirect directly without trying to write to Firestore
              router.push('/dashboard-admin');
            } catch (error) {
              console.error('Guest login error:', error);
              // Even if there's an error, still redirect to dashboard
              router.push('/dashboard-admin');
            }
          }}
          variant="outlined"
          fullWidth
          sx={{
            mt: 1,
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 2,
            py: 1.5,
            boxShadow: '0 2px 8px 0 rgba(30,58,138,0.06)',
            textTransform: "none",
            letterSpacing: 0.2,
          }}
        >
          Login sebagai Guest
        </Button>
        {error && (
          <Typography color="error" mt={2} textAlign="center">
            {error}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
