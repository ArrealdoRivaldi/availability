/**
 * Delete Modal Component for Cell Down Data Management
 * Handles confirmation dialogs for single and bulk delete operations
 */

import React from 'react';
import {
  Dialog,
  Button,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { DeleteForever as DeleteForeverIcon } from '@mui/icons-material';
import { DeleteType } from '../types';

interface DeleteModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Function to confirm deletion */
  onConfirm: () => void;
  /** Type of deletion (single or bulk) */
  deleteType: DeleteType;
  /** Item to delete (for single delete) */
  itemToDelete?: any;
  /** Number of filtered records (for bulk delete) */
  filteredDataCount: number;
  /** Whether deletion is in progress */
  deleting: boolean;
}

/**
 * Delete Modal Component
 * Provides confirmation dialog for delete operations with animated UI
 */
export const DeleteModal: React.FC<DeleteModalProps> = ({
  open,
  onClose,
  onConfirm,
  deleteType,
  itemToDelete,
  filteredDataCount,
  deleting
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={() => !deleting && onClose()} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px'
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
        minWidth: '400px'
      }}>
        {/* Warning Icon with Animation */}
        <Box sx={{ 
          position: 'relative',
          display: 'inline-block',
          mb: 3
        }}>
          <Box sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'error.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 0.6s ease-out',
            '@keyframes pulse': {
              '0%': { transform: 'scale(0.3)', opacity: 0 },
              '50%': { transform: 'scale(1.1)', opacity: 1 },
              '100%': { transform: 'scale(1)', opacity: 1 }
            }
          }}>
            <DeleteForeverIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
        </Box>

        {/* Warning Message */}
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'error.main' }}>
          {deleteType === 'single' ? 'Delete Data?' : `Delete All Filtered Data?`}
        </Typography>
        
        <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
          {deleteType === 'single' 
            ? `Are you sure you want to delete "${itemToDelete?.cellDownName}"? This action cannot be undone.`
            : `Are you sure you want to delete ALL ${filteredDataCount} filtered records? This action cannot be undone and will delete all data that matches your current search/filter criteria.`
          }
        </Typography>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={deleting}
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={onConfirm}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : <DeleteForeverIcon />}
            sx={{ 
              minWidth: 120,
              backgroundColor: '#d32f2f',
              '&:hover': { backgroundColor: '#b71c1c' }
            }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};
