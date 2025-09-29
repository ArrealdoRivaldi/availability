/**
 * Success Modal Component for Cell Down Data Management
 * Shows success message after successful operations
 */

import React from 'react';
import {
  Dialog,
  Box,
  Typography
} from '@mui/material';

interface SuccessModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Success message title */
  title?: string;
  /** Success message content */
  message?: string;
}

/**
 * Success Modal Component
 * Displays animated success message for completed operations
 */
export const SuccessModal: React.FC<SuccessModalProps> = ({
  open,
  onClose,
  title = "Upload Berhasil!",
  message = "Data berhasil diupload ke sistem"
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '250px'
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)'
        }
      }}
    >
      <Box sx={{ 
        textAlign: 'center', 
        p: 4,
        backgroundColor: 'white',
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        minWidth: '350px',
        animation: 'slideIn 0.5s ease-out',
        '@keyframes slideIn': {
          '0%': { transform: 'translateY(-50px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 }
        }
      }}>
        {/* Success Icon with Animation */}
        <Box sx={{ 
          position: 'relative',
          display: 'inline-block',
          mb: 3
        }}>
          <Box sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'success.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'bounce 0.6s ease-out',
            '@keyframes bounce': {
              '0%': { transform: 'scale(0.3)', opacity: 0 },
              '50%': { transform: 'scale(1.1)', opacity: 1 },
              '100%': { transform: 'scale(1)', opacity: 1 }
            }
          }}>
            <Typography variant="h2" sx={{ color: 'white', fontWeight: 'bold' }}>
              ✓
            </Typography>
          </Box>
        </Box>

        {/* Success Message */}
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'success.main' }}>
          {title}
        </Typography>
        
        <Typography variant="body1" color="textSecondary">
          {message}
        </Typography>
      </Box>
    </Dialog>
  );
};
