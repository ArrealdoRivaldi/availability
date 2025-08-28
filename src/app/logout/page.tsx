'use client';
import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/app/firebaseConfig';
import { doc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Hapus user dari active_users jika login
        const user = auth.currentUser;
        if (user) {
          try {
            await deleteDoc(doc(db, 'active_users', user.uid));
          } catch (error) {
            console.error('Error removing user from active_users:', error);
          }
        }

        // Logout dari Firebase
        try {
          await signOut(auth);
        } catch (error) {
          console.error('Error signing out from Firebase:', error);
        }

        // Hapus semua data dari localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('userRole');
          localStorage.removeItem('hideApprovalMenu');
          localStorage.removeItem('authToken');
          localStorage.removeItem('userEmail');
        }

        // Hapus cookie
        document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

        // Redirect ke halaman login setelah delay singkat
        setTimeout(() => {
          router.push('/');
        }, 1000);

      } catch (error) {
        console.error('Error during logout:', error);
        // Tetap redirect ke login meskipun ada error
        setTimeout(() => {
          router.push('/');
        }, 1000);
      }
    };

    performLogout();
  }, [router]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f7fafd",
        gap: 3,
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h5" color="text.secondary">
        Logging out...
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Redirecting to login page...
      </Typography>
    </Box>
  );
}
