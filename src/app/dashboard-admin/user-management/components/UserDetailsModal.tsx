import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Divider,
  Avatar
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

interface User {
  id: string;
  displayName: string;
  email: string;
  nop: string;
  role: string;
  createdAt?: any;
  lastLoginAt?: any;
  updatedAt?: any;
}

interface UserDetailsModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

export default function UserDetailsModal({ open, onClose, user }: UserDetailsModalProps) {
  if (!user) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'error';
      case 'admin':
        return 'warning';
      case 'user':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getNopColor = (nop: string) => {
    const nopColors: { [key: string]: string } = {
      'kalimantan': 'success',
      'sumatra': 'info',
      'jawa': 'warning',
      'sulawesi': 'secondary',
      'papua': 'default'
    };
    return nopColors[nop.toLowerCase()] || 'default';
  };

  const formatDate = (date: any) => {
    if (!date) return 'Not available';
    try {
      if (date.toDate) {
        return date.toDate().toLocaleString();
      }
      if (date instanceof Date) {
        return date.toLocaleString();
      }
      return new Date(date).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <PersonIcon />
          </Avatar>
          <Typography variant="h6">User Details</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Display Name
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {user.displayName}
              </Typography>

              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Email Address
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {user.email}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                NOP (Network Operation Point)
              </Typography>
              <Chip
                label={user.nop}
                color={getNopColor(user.nop) as any}
                variant="outlined"
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Role
              </Typography>
              <Chip
                label={user.role.replace('_', ' ').toUpperCase()}
                color={getRoleColor(user.role) as any}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                User ID
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {user.id}
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Created At
              </Typography>
              <Typography variant="body2">
                {formatDate(user.createdAt)}
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Last Updated
              </Typography>
              <Typography variant="body2">
                {formatDate(user.updatedAt)}
              </Typography>
            </Grid>

            {user.lastLoginAt && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Last Login
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(user.lastLoginAt)}
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
