/**
 * Upload Preview Modal Component for Cell Down Data Management
 * Shows preview of data to be uploaded with statistics
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip
} from '@mui/material';
import { CellDownData, UploadStats } from '../types';
import { PREVIEW_MAX_ROWS } from '../constants';

interface UploadPreviewModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Function to confirm upload */
  onConfirm: () => void;
  /** Preview data to display */
  previewData: CellDownData[];
  /** Upload statistics */
  uploadStats: UploadStats;
  /** Total existing data count */
  totalExistingData: number;
  /** Whether upload is in progress */
  uploading: boolean;
}

/**
 * Upload Preview Modal Component
 * Displays preview of data to be uploaded with detailed statistics
 */
export const UploadPreviewModal: React.FC<UploadPreviewModalProps> = ({
  open,
  onClose,
  onConfirm,
  previewData,
  uploadStats,
  totalExistingData,
  uploading
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
          Preview Upload Data
        </Typography>
        
        {/* UPLOAD Section */}
        <Box sx={{ mb: 3, p: 2, backgroundColor: '#e8f5e8', borderRadius: 2, border: '2px solid #4caf50' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main', mb: 2 }}>
            UPLOAD
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Total Data:</strong> {uploadStats.totalUploadedData}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Week:</strong> {uploadStats.currentWeek}
          </Typography>
        </Box>

        {/* Update Week Sebelumnya Section */}
        <Box sx={{ mb: 3, p: 2, backgroundColor: '#fff3e0', borderRadius: 2, border: '2px solid #ff9800' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main', mb: 2 }}>
            Update Week Sebelumnya
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Week:</strong> {uploadStats.previousWeek}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Total Data:</strong> {totalExistingData}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Total Data Open:</strong> {uploadStats.existingOpenBeforeUpload}
          </Typography>
          <Typography variant="body1">
            <strong>Total Data Close:</strong> {uploadStats.actualCloseCount}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small" sx={{ borderCollapse: 'collapse' }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 60 }}>No.</TableCell>
                <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 80 }}>Week</TableCell>
                <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 100 }}>Site ID</TableCell>
                <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 150 }}>Cell Down Name</TableCell>
                <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 120 }}>NOP</TableCell>
                <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 80 }}>TO</TableCell>
                <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 100 }}>AGING DOWN</TableCell>
                <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 140 }}>RANGE AGING DOWN</TableCell>
                <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 100 }}>SITE CLASS</TableCell>
                <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 120 }}>Sub Domain</TableCell>
                <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 100 }}>Category</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {previewData.slice(0, PREVIEW_MAX_ROWS).map((row, index) => (
                <TableRow key={index} sx={{ 
                  '&:nth-of-type(even)': { backgroundColor: '#fafafa' }
                }}>
                  <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>{index + 1}</TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>{row.week}</TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px', fontWeight: 'bold' }}>{row.siteId}</TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 4px' }}>{row.cellDownName}</TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>{row.nop}</TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>
                    {row.to || ''}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>{row.agingDown}</TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>{row.rangeAgingDown}</TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>
                    <Chip 
                      label={row.siteClass} 
                      color={row.siteClass === 'GOLD' ? 'warning' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>
                    {row.subDomain}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>
                    <Chip 
                      label={row.category || ''} 
                      color={row.category === 'Site Down' ? 'error' : 'primary'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
              {previewData.length > PREVIEW_MAX_ROWS && (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ border: '1px solid #e0e0e0', padding: '16px' }}>
                    <Typography variant="body2" color="textSecondary">
                      ... and {previewData.length - PREVIEW_MAX_ROWS} more records
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Confirm Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
