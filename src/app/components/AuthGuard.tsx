'use client';
import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/app/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requiredRoles = ['super_admin', 'admin', 'guest'], 
  redirectTo = '/' 
}: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          // Verifikasi user di Firestore
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const role = userData.role;
            
            // Cek apakah user memiliki role yang valid
            if (requiredRoles.includes(role)) {
              // Set role ke localStorage
              if (typeof window !== 'undefined') {
                localStorage.setItem('userRole', role);
                if (role === "admin") {
                  localStorage.setItem('hideApprovalMenu', 'true');
                } else {
                  localStorage.removeItem('hideApprovalMenu');
                }
              }
              setUserRole(role);
              setIsAuthenticated(true);
            } else {
              // Role tidak valid
              setIsAuthenticated(false);
              setUserRole(null);
              if (typeof window !== 'undefined') {
                localStorage.removeItem('userRole');
                localStorage.removeItem('hideApprovalMenu');
              }
              router.push(redirectTo);
            }
          } else {
            // User tidak ada di Firestore
            setIsAuthenticated(false);
            setUserRole(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('userRole');
              localStorage.removeItem('hideApprovalMenu');
            }
            router.push(redirectTo);
          }
        } catch (error) {
          console.error("Error verifying user:", error);
          setIsAuthenticated(false);
          setUserRole(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('userRole');
            localStorage.removeItem('hideApprovalMenu');
          }
          router.push(redirectTo);
        }
      } else {
        // User tidak login
        setIsAuthenticated(false);
        setUserRole(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('userRole');
          localStorage.removeItem('hideApprovalMenu');
        }
        router.push(redirectTo);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router, requiredRoles, redirectTo]);

  // Loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "#f7fafd",
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Verifying authentication...
        </Typography>
      </Box>
    );
  }

  // Jika tidak terautentikasi, tampilkan pesan dan tombol login
  if (!isAuthenticated) {
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
        <Typography variant="h4" color="error" textAlign="center">
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth={400}>
          You need to be authenticated to access this page. Please log in with appropriate credentials.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => router.push('/')}
          sx={{ mt: 2 }}
        >
          Go to Login
        </Button>
      </Box>
    );
  }

  // Jika terautentikasi, render children
  return <>{children}</>;
}

// Hook untuk menggunakan status autentikasi di komponen lain
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error verifying user:", error);
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { isAuthenticated, userRole, isLoading };
}
