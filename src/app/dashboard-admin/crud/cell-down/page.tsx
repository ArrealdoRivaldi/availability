'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { 
  Box, 
  Grid, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Card,
  CardContent,
  Button,
  IconButton,
  Tooltip,
  alpha
} from '@mui/material';
import { Edit as EditIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { CellDownData, mapFirestoreData } from '../../../../utils/cellDownDataMapper';
import EditCellDownModal from '../../dashboard/cell-down/components/EditCellDownModal';

export default function CellDownCrudPage() {
  const [cellDownData, setCellDownData] = useState<CellDownData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCellDown, setSelectedCellDown] = useState<CellDownData | null>(null);

  useEffect(() => {
    fetchCellDownData();
  }, []);

  const fetchCellDownData = async () => {
    try {
      console.log('Fetching cell down data...');
      const q = query(collection(db, 'data_celldown'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data: CellDownData[] = [];
      
      console.log(`Found ${querySnapshot.size} documents`);
      
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        console.log('Document data:', docData);
        const mappedData = mapFirestoreData(docData, doc.id);
        data.push(mappedData);
      });
      
      console.log('Processed data:', data);
      setCellDownData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCellDown = (cellDown: CellDownData) => {
    setSelectedCellDown(cellDown);
    setEditModalOpen(true);
  };

  const handleSaveCellDown = async (updatedData: Partial<CellDownData>) => {
    try {
      // Here you would typically update the data in Firestore
      // For now, we'll just update the local state
      setCellDownData(prevData => 
        prevData.map(item => 
          item.id === updatedData.id ? { ...item, ...updatedData } : item
        )
      );
      console.log('Cell down data updated:', updatedData);
    } catch (error) {
      console.error('Error updating cell down data:', error);
    }
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedCellDown(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="text.secondary">Loading cell down data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 2, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
            Cell Down CRUD
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage cell down incidents data
          </Typography>
        </Box>
        <Tooltip title="Refresh Data">
          <IconButton 
            onClick={fetchCellDownData} 
            sx={{ 
              backgroundColor: '#1976d2', 
              color: 'white',
              '&:hover': { backgroundColor: '#1565c0' }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Data Table */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
            Cell Down Data
          </Typography>
          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#fafafa' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Cell Down Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>NOP</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Root Cause</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Progress</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cellDownData.map((item) => (
                  <TableRow key={item.id} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                    <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {item.cellDownName || 'No name'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{item.nop || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{item.category || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{item.rootCause || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{item.progress || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{item.status || '-'}</TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.875rem' }}>
                      <Tooltip title="Edit Cell Down Data">
                        <IconButton
                          size="small"
                          onClick={() => handleEditCellDown(item)}
                          sx={{
                            color: '#1976d2',
                            '&:hover': {
                              backgroundColor: alpha('#1976d2', 0.1)
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Cell Down Modal */}
      <EditCellDownModal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveCellDown}
        cellDownData={selectedCellDown}
      />
    </Box>
  );
}
