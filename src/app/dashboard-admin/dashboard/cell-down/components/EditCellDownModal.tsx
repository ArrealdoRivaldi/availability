'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Divider,
  SelectChangeEvent,
  alpha
} from '@mui/material';
import { CellDownData } from '../../../../../utils/cellDownDataMapper';

interface EditCellDownModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<CellDownData>) => void;
  cellDownData: CellDownData | null;
}

const EditCellDownModal: React.FC<EditCellDownModalProps> = ({
  open,
  onClose,
  onSave,
  cellDownData
}) => {
  const [formData, setFormData] = useState<Partial<CellDownData>>({});

  useEffect(() => {
    if (cellDownData) {
      setFormData({
        id: cellDownData.id,
        cellDownName: cellDownData.cellDownName || '',
        rootCause: cellDownData.rootCause || '',
        picDept: cellDownData.picDept || '',
        progress: cellDownData.progress || '',
        category: cellDownData.category || '',
        detailProblem: cellDownData.detailProblem || '',
        planAction: cellDownData.planAction || '',
        needSupport: cellDownData.needSupport || ''
      });
    }
  }, [cellDownData]);

  const handleInputChange = (field: keyof CellDownData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const rootCauseOptions = [
    'Power Issue',
    'Transmission Issue',
    'Trial Lock',
    'Database',
    'Vandalism',
    'Software Issue',
    'Configuration Issue',
    'Other'
  ];

  const progressOptions = [
    'In Progress',
    'Done',
    'Waiting team',
    'Trial Lock',
    'Waiting SVA',
    'Waiting Support PIC DEPT',
    'On Hold',
    'Cancelled'
  ];

  const categoryOptions = [
    'Site Down',
    'Cell Down'
  ];

  const picDeptOptions = [
    'Network Operations',
    'Field Operations',
    'Technical Support',
    'Maintenance',
    'Engineering',
    'Other'
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2,
        background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 600,
        fontSize: '1.5rem'
      }}>
        Edit Cell Down Data
      </DialogTitle>
      
      <Divider sx={{ borderColor: alpha('#1976d2', 0.2) }} />
      
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Cell Down Name Display */}
          <Box>
            <Typography variant="subtitle2" sx={{ 
              fontWeight: 600, 
              color: '#1976d2', 
              mb: 1,
              fontSize: '0.9rem'
            }}>
              Cell Down Name
            </Typography>
            <Typography variant="body1" sx={{ 
              p: 2, 
              backgroundColor: alpha('#1976d2', 0.05),
              borderRadius: 2,
              border: `1px solid ${alpha('#1976d2', 0.1)}`,
              fontWeight: 500,
              color: '#1a1a1a'
            }}>
              {cellDownData?.cellDownName || 'No name available'}
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {/* Root Cause */}
            <FormControl fullWidth>
              <InputLabel sx={{ 
                color: '#666',
                fontWeight: 500,
                '&.Mui-focused': { color: '#1976d2' }
              }}>
                Root Cause
              </InputLabel>
              <Select
                name="rootCause"
                value={formData.rootCause || ''}
                label="Root Cause"
                onChange={handleSelectChange}
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': { 
                    borderColor: '#e0e0e0',
                    borderWidth: 2
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': { 
                    borderColor: '#1976d2',
                    borderWidth: 2
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1976d2',
                    borderWidth: 2
                  }
                }}
              >
                {rootCauseOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* PIC Department */}
            <FormControl fullWidth>
              <InputLabel sx={{ 
                color: '#666',
                fontWeight: 500,
                '&.Mui-focused': { color: '#1976d2' }
              }}>
                PIC Department
              </InputLabel>
              <Select
                name="picDept"
                value={formData.picDept || ''}
                label="PIC Department"
                onChange={handleSelectChange}
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': { 
                    borderColor: '#e0e0e0',
                    borderWidth: 2
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': { 
                    borderColor: '#1976d2',
                    borderWidth: 2
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1976d2',
                    borderWidth: 2
                  }
                }}
              >
                {picDeptOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {/* Progress */}
            <FormControl fullWidth>
              <InputLabel sx={{ 
                color: '#666',
                fontWeight: 500,
                '&.Mui-focused': { color: '#1976d2' }
              }}>
                Progress
              </InputLabel>
              <Select
                name="progress"
                value={formData.progress || ''}
                label="Progress"
                onChange={handleSelectChange}
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': { 
                    borderColor: '#e0e0e0',
                    borderWidth: 2
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': { 
                    borderColor: '#1976d2',
                    borderWidth: 2
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1976d2',
                    borderWidth: 2
                  }
                }}
              >
                {progressOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Category */}
            <FormControl fullWidth>
              <InputLabel sx={{ 
                color: '#666',
                fontWeight: 500,
                '&.Mui-focused': { color: '#1976d2' }
              }}>
                Category
              </InputLabel>
              <Select
                name="category"
                value={formData.category || ''}
                label="Category"
                onChange={handleSelectChange}
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': { 
                    borderColor: '#e0e0e0',
                    borderWidth: 2
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': { 
                    borderColor: '#1976d2',
                    borderWidth: 2
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1976d2',
                    borderWidth: 2
                  }
                }}
              >
                {categoryOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Detail Problem */}
          <TextField
            name="detailProblem"
            label="Detail Problem"
            multiline
            rows={3}
            value={formData.detailProblem || ''}
            onChange={(e) => handleInputChange('detailProblem', e.target.value)}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': { 
                  borderColor: '#e0e0e0',
                  borderWidth: 2
                },
                '&:hover fieldset': { 
                  borderColor: '#1976d2',
                  borderWidth: 2
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2',
                  borderWidth: 2
                }
              },
              '& .MuiInputLabel-root': {
                color: '#666',
                fontWeight: 500,
                '&.Mui-focused': { color: '#1976d2' }
              }
            }}
          />

          {/* Plan Action */}
          <TextField
            name="planAction"
            label="Plan Action"
            multiline
            rows={3}
            value={formData.planAction || ''}
            onChange={(e) => handleInputChange('planAction', e.target.value)}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': { 
                  borderColor: '#e0e0e0',
                  borderWidth: 2
                },
                '&:hover fieldset': { 
                  borderColor: '#1976d2',
                  borderWidth: 2
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2',
                  borderWidth: 2
                }
              },
              '& .MuiInputLabel-root': {
                color: '#666',
                fontWeight: 500,
                '&.Mui-focused': { color: '#1976d2' }
              }
            }}
          />

          {/* Need Support */}
          <TextField
            name="needSupport"
            label="Need Support"
            multiline
            rows={3}
            value={formData.needSupport || ''}
            onChange={(e) => handleInputChange('needSupport', e.target.value)}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': { 
                  borderColor: '#e0e0e0',
                  borderWidth: 2
                },
                '&:hover fieldset': { 
                  borderColor: '#1976d2',
                  borderWidth: 2
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2',
                  borderWidth: 2
                }
              },
              '& .MuiInputLabel-root': {
                color: '#666',
                fontWeight: 500,
                '&.Mui-focused': { color: '#1976d2' }
              }
            }}
          />
        </Box>
      </DialogContent>

      <Divider sx={{ borderColor: alpha('#1976d2', 0.2) }} />
      
      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            borderColor: '#e0e0e0',
            color: '#666',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': { 
              borderColor: '#1976d2', 
              color: '#1976d2',
              backgroundColor: alpha('#1976d2', 0.05)
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            backgroundColor: '#1976d2',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': { 
              backgroundColor: '#1565c0'
            }
          }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditCellDownModal;
