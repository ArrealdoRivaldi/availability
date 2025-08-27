import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  loading: boolean;
}

export default function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  userName,
  loading
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          <Typography variant="h6">Confirm User Deletion</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone.
          </Alert>
          
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete the user:
          </Typography>
          
          <Typography 
            variant="h6" 
            color="primary" 
            sx={{ 
              fontWeight: 'bold', 
              mb: 2,
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.300'
            }}
          >
            {userName}
          </Typography>
          
          <Typography variant="body2" color="textSecondary">
            This will permanently remove the user account and all associated data from the system.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Deleting...' : 'Delete User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
