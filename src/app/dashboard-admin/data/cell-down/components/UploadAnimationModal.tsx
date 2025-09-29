/**
 * Upload Animation Modal Component for Cell Down Data Management
 * Shows animated progress during data upload process
 */

import React from 'react';
import {
  Dialog,
  Box,
  Typography,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { ChunkProgress } from '../types';

interface UploadAnimationModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Upload progress percentage */
  uploadProgress: number;
  /** Chunk progress information */
  chunkProgress: ChunkProgress;
  /** Current upload status message */
  uploadStatus: string;
}

/**
 * Upload Animation Modal Component
 * Displays animated progress indicator during upload process
 */
export const UploadAnimationModal: React.FC<UploadAnimationModalProps> = ({
  open,
  uploadProgress,
  chunkProgress,
  uploadStatus
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={() => {}} 
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
        {/* Animated Upload Icon */}
        <Box sx={{ 
          position: 'relative',
          display: 'inline-block',
          mb: 3
        }}>
          <CloudUploadIcon 
            sx={{ 
              fontSize: 80, 
              color: 'primary.main',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)', opacity: 1 },
                '50%': { transform: 'scale(1.1)', opacity: 0.7 },
                '100%': { transform: 'scale(1)', opacity: 1 }
              }
            }} 
          />
          <CircularProgress
            size={90}
            thickness={2}
            sx={{
              position: 'absolute',
              top: -5,
              left: -5,
              color: 'primary.main',
              animation: 'spin 2s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          />
        </Box>

        {/* Upload Status */}
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Uploading Data...
        </Typography>
        
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          {uploadStatus || 'Processing your data...'}
        </Typography>

        {/* Progress Bar */}
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={uploadProgress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
              }
            }} 
          />
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            {Math.round(uploadProgress)}% Complete
          </Typography>
        </Box>

        {/* Chunk Progress */}
        {chunkProgress.total > 0 && (
          <Typography variant="body2" color="textSecondary">
            Chunk {chunkProgress.current} of {chunkProgress.total} ({chunkProgress.percentage}%)
          </Typography>
        )}
      </Box>
    </Dialog>
  );
};
