'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { auth, db } from '@/app/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

interface AuthDebuggerProps {
  show?: boolean;
}

export const AuthDebugger: React.FC<AuthDebuggerProps> = ({ show = false }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [localStorageRole, setLocalStorageRole] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string>('checking');

  useEffect(() => {
    if (!show) return;

    // Check localStorage role
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      setLocalStorageRole(role);
    }

    // Check Firebase auth status
    if (!auth) {
      setAuthStatus('auth-not-initialized');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthStatus(user ? 'authenticated' : 'not-authenticated');
    });

    return () => unsubscribe();
  }, [show]);

  if (!show) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
      <Typography variant="h6" gutterBottom>
        🔍 Authentication Debug Info
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">Firebase Auth Status:</Typography>
          <Chip 
            label={authStatus} 
            color={authStatus === 'authenticated' ? 'success' : 'error'}
            size="small"
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">Firebase User:</Typography>
          <Chip 
            label={firebaseUser ? firebaseUser.email || 'No email' : 'None'} 
            color={firebaseUser ? 'success' : 'default'}
            size="small"
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">LocalStorage Role:</Typography>
          <Chip 
            label={localStorageRole || 'None'} 
            color={localStorageRole ? 'primary' : 'default'}
            size="small"
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">Database Status:</Typography>
          <Chip 
            label={db ? 'Initialized' : 'Not Initialized'} 
            color={db ? 'success' : 'error'}
            size="small"
          />
        </Box>
      </Box>
    </Paper>
  );
};
