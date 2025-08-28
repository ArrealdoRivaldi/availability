'use client';
import React from 'react';
import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/app/firebaseConfig';
import { doc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

interface LogoutButtonProps {
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export default function LogoutButton({ 
  variant = 'outlined', 
  color = 'error', 
  size = 'medium',
  fullWidth = false,
  children = 'Logout'
}: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
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

      // Redirect ke halaman login
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
      // Tetap redirect ke login meskipun ada error
      router.push('/');
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
    >
      {children}
    </Button>
  );
}
