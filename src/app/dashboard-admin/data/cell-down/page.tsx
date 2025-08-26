'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider
} from '@mui/material';
import {
  Upload as UploadIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import CellDownDetailView from './components/CellDownDetailView';
import ExportToExcel from './components/ExportToExcel';
import ExcelTemplate from './components/ExcelTemplate';
import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '@/app/firebaseConfig';
import * as XLSX from 'exceljs';

interface CellDownData {
  id?: string;
  week: number;
  regional: string;
  siteId: string;
  alarmSource: string;
  nop: string;
  districtOperation: string;
  firstOccurredOn: string;
  agingDown: number;
  rangeAgingDown: string;
  ticketId: string;
  alarmName: string;
  siteClass: string;
  subDomain: string;
  alarmSeverity: string;
  alarmLocationInfo: string;
  remarkRedsector: string;
  remarkSite: string;
  cellDownName: string;
  rootCause: string;
  detailProblem: string;
  planAction: string;
  needSupport: string;
  picDept: string;
  progress: string;
  closedDate: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface EditModalData {
  id: string;
  rootCause: string;
  detailProblem: string;
  planAction: string;
  needSupport: string;
  picDept: string;
  progress: string;
  closedDate: string;
}

const rootCauseOptions = [
  'Hardware',
  'Power',
  'Transport',
  'Comcase',
  'Dismantle',
  'Combat Relocation',
  'IKN'
];

const picDeptOptions = [
  'ENOM',
  'NOP',
  'NOS',
  'SQA',
  'CTO',
  'RTPD',
  'RTPE'
];

const progressOptions = [
  'OPEN',
  'DONE'
];

export default function CellDownDataPage() {
  const [data, setData] = useState<CellDownData[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<CellDownData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedData, setSelectedData] = useState<CellDownData | null>(null);
  const [editData, setEditData] = useState<EditModalData>({
    id: '',
    rootCause: '',
    detailProblem: '',
    planAction: '',
    needSupport: '',
    picDept: '',
    progress: 'OPEN',
    closedDate: ''
  });
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [chunkSize] = useState(50);
  const [userRole, setUserRole] = useState<string>('');

  // Check user role on component mount
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role || '');
  }, []);

  // Check if user is super admin
  const isSuperAdmin = userRole === 'super_admin';

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'data_celldown'),
        orderBy('createdAt', 'desc'),
        limit(chunkSize)
      );
      const querySnapshot = await getDocs(q);
      const newData: CellDownData[] = [];
      querySnapshot.forEach((doc) => {
        newData.push({ id: doc.id, ...doc.data() } as CellDownData);
      });
      setData(newData);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === chunkSize);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreData = async () => {
    if (!hasMore || !lastDoc) return;
    
    try {
      const q = query(
        collection(db, 'data_celldown'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(chunkSize)
      );
      const querySnapshot = await getDocs(q);
      const newData: CellDownData[] = [];
      querySnapshot.forEach((doc) => {
        newData.push({ id: doc.id, ...doc.data() } as CellDownData);
      });
      setData(prev => [...prev, ...newData]);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === chunkSize);
    } catch (error) {
      console.error('Error loading more data:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Check if user is super admin
    if (!isSuperAdmin) {
      alert('Access denied. Only Super Admin users can upload data.');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      
      const workbook = new XLSX.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) throw new Error('No worksheet found');

      const previewRows: CellDownData[] = [];
      let rowCount = 0;
      const totalRows = worksheet.rowCount - 1; // Exclude header

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const rowData: CellDownData = {
          week: parseInt(row.getCell(1)?.value?.toString() || '0'),
          regional: row.getCell(2)?.value?.toString() || '',
          siteId: row.getCell(3)?.value?.toString() || '',
          alarmSource: row.getCell(4)?.value?.toString() || '',
          nop: row.getCell(5)?.value?.toString() || '',
          districtOperation: row.getCell(6)?.value?.toString() || '',
          firstOccurredOn: row.getCell(7)?.value?.toString() || '',
          agingDown: parseInt(row.getCell(8)?.value?.toString() || '0'),
          rangeAgingDown: row.getCell(9)?.value?.toString() || '',
          ticketId: row.getCell(10)?.value?.toString() || '',
          alarmName: row.getCell(11)?.value?.toString() || '',
          siteClass: row.getCell(12)?.value?.toString() || '',
          subDomain: row.getCell(13)?.value?.toString() || '',
          alarmSeverity: row.getCell(14)?.value?.toString() || '',
          alarmLocationInfo: row.getCell(15)?.value?.toString() || '',
          remarkRedsector: row.getCell(16)?.value?.toString() || '',
          remarkSite: row.getCell(17)?.value?.toString() || '',
          cellDownName: row.getCell(18)?.value?.toString() || '',
          rootCause: '',
          detailProblem: '',
          planAction: '',
          needSupport: '',
          picDept: '',
          progress: 'OPEN',
          closedDate: '',
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        previewRows.push(rowData);
        rowCount++;
        setUploadProgress((rowCount / totalRows) * 100);
      });

      setPreviewData(previewRows);
      setShowPreview(true);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please check the file format.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const confirmUpload = async () => {
    // Check if user is super admin
    if (!isSuperAdmin) {
      alert('Access denied. Only Super Admin users can upload data.');
      return;
    }

    if (previewData.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const batchSize = 100; // Process in batches
      let processed = 0;

      for (let i = 0; i < previewData.length; i += batchSize) {
        const batch = previewData.slice(i, i + batchSize);
        
        // Add documents to Firestore
        for (const item of batch) {
          await addDoc(collection(db, 'data_celldown'), item);
        }
        
        processed += batch.length;
        setUploadProgress((processed / previewData.length) * 100);
        
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      alert(`Successfully uploaded ${previewData.length} records!`);
      setShowPreview(false);
      setPreviewData([]);
      loadData(); // Reload data
    } catch (error) {
      console.error('Error uploading data:', error);
      alert('Error uploading data. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEdit = (row: CellDownData) => {
    // All roles can edit data
    setEditData({
      id: row.id || '',
      rootCause: row.rootCause || '',
      detailProblem: row.detailProblem || '',
      planAction: row.planAction || '',
      needSupport: row.needSupport || '',
      picDept: row.picDept || '',
      progress: row.progress || 'OPEN',
      closedDate: row.closedDate || ''
    });
    setEditModal(true);
  };

  const handleViewDetail = (row: CellDownData) => {
    setSelectedData(row);
    setDetailModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editData.id) return;

    try {
      const docRef = doc(db, 'data_celldown', editData.id);
      const updateData = {
        ...editData,
        updatedAt: new Date(),
        status: editData.progress === 'DONE' ? 'close' : 'open'
      };
      
      await updateDoc(docRef, updateData);
      
      // Update local state
      setData(prev => prev.map(item => 
        item.id === editData.id 
          ? { ...item, ...updateData }
          : item
      ));
      
      setEditModal(false);
      alert('Data updated successfully!');
    } catch (error) {
      console.error('Error updating data:', error);
      alert('Error updating data. Please try again.');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'error';
      case 'major': return 'warning';
      case 'minor': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'open' ? 'warning' : 'success';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Cell Down Data Management
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Role:
          </Typography>
          <Chip 
            label={userRole || 'Loading...'} 
            color={isSuperAdmin ? 'success' : 'default'}
            size="small"
          />
        </Box>
      </Box>

      {/* Upload Section - Only for Super Admin */}
      {isSuperAdmin ? (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Upload Data (Super Admin Only)"
            avatar={<CloudUploadIcon />}
            subheader="Only users with Super Admin role can upload data"
          />
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <input
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<UploadIcon />}
                    disabled={uploading}
                  >
                    Choose Excel File
                  </Button>
                </label>
              </Grid>
              <Grid item>
                <ExcelTemplate />
              </Grid>
              <Grid item>
                <Typography variant="body2" color="textSecondary">
                  Supported formats: .xlsx, .xls
                </Typography>
              </Grid>
            </Grid>
            
            {uploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Processing: {Math.round(uploadProgress)}%
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Access Restricted"
            avatar={<CloudUploadIcon />}
            subheader="Upload functionality is restricted to Super Admin users only"
          />
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body1" color="textSecondary" gutterBottom>
                You need Super Admin privileges to upload data.
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Contact your administrator if you need access to this feature.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>Preview Upload Data ({previewData.length} records)</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
                             <TableHead>
                 <TableRow>
                   <TableCell>Week</TableCell>
                   <TableCell>Site ID</TableCell>
                   <TableCell>NOP</TableCell>
                   <TableCell>AGING DOWN</TableCell>
                   <TableCell>RANGE AGING DOWN</TableCell>
                   <TableCell>SITE CLASS</TableCell>
                   <TableCell>Sub Domain</TableCell>
                   <TableCell>Cell Down Name</TableCell>
                   <TableCell>Status</TableCell>
                 </TableRow>
               </TableHead>
              <TableBody>
                                 {previewData.slice(0, 20).map((row, index) => (
                   <TableRow key={index}>
                     <TableCell>{row.week}</TableCell>
                     <TableCell>{row.siteId}</TableCell>
                     <TableCell>{row.nop}</TableCell>
                     <TableCell>{row.agingDown}</TableCell>
                     <TableCell>{row.rangeAgingDown}</TableCell>
                     <TableCell>{row.siteClass}</TableCell>
                     <TableCell>{row.subDomain}</TableCell>
                     <TableCell>{row.cellDownName}</TableCell>
                     <TableCell>
                       <Chip label="Ready to Upload" color="info" size="small" />
                     </TableCell>
                   </TableRow>
                 ))}
                                 {previewData.length > 20 && (
                   <TableRow>
                     <TableCell colSpan={9} align="center">
                       <Typography variant="body2" color="textSecondary">
                         ... and {previewData.length - 20} more records
                       </Typography>
                     </TableCell>
                   </TableRow>
                 )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Cancel</Button>
          <Button 
            onClick={confirmUpload} 
            variant="contained" 
            disabled={uploading}
          >
            Confirm Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModal} onClose={() => setEditModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Cell Down Data</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Root Cause</InputLabel>
                <Select
                  value={editData.rootCause}
                  onChange={(e) => setEditData({ ...editData, rootCause: e.target.value })}
                  label="Root Cause"
                >
                  {rootCauseOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>PIC Department</InputLabel>
                <Select
                  value={editData.picDept}
                  onChange={(e) => setEditData({ ...editData, picDept: e.target.value })}
                  label="PIC Department"
                >
                  {picDeptOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Progress</InputLabel>
                <Select
                  value={editData.progress}
                  onChange={(e) => setEditData({ ...editData, progress: e.target.value })}
                  label="Progress"
                >
                  {progressOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Closed Date"
                type="date"
                value={editData.closedDate}
                onChange={(e) => setEditData({ ...editData, closedDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Detail Problem"
                value={editData.detailProblem}
                onChange={(e) => setEditData({ ...editData, detailProblem: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Plan Action"
                value={editData.planAction}
                onChange={(e) => setEditData({ ...editData, planAction: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Need Support"
                value={editData.needSupport}
                onChange={(e) => setEditData({ ...editData, needSupport: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModal(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Data Table */}
      <Card>
        <CardHeader
          title={`Cell Down Data (${data.length} records)`}
          action={
            <ExportToExcel 
              data={data} 
              onExport={() => {
                // Refresh data after export if needed
              }} 
            />
          }
        />
        <CardContent>
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
                             <TableHead>
                 <TableRow>
                   <TableCell>Week</TableCell>
                   <TableCell>Site ID</TableCell>
                   <TableCell>NOP</TableCell>
                   <TableCell>AGING DOWN</TableCell>
                   <TableCell>RANGE AGING DOWN</TableCell>
                   <TableCell>SITE CLASS</TableCell>
                   <TableCell>Sub Domain</TableCell>
                   <TableCell>Cell Down Name</TableCell>
                   <TableCell>Status</TableCell>
                   <TableCell>Actions</TableCell>
                 </TableRow>
               </TableHead>
                <TableBody>
                                     {data.map((row) => (
                     <TableRow key={row.id} hover>
                       <TableCell>{row.week}</TableCell>
                       <TableCell>{row.siteId}</TableCell>
                       <TableCell>{row.nop}</TableCell>
                       <TableCell>{row.agingDown}</TableCell>
                       <TableCell>{row.rangeAgingDown}</TableCell>
                       <TableCell>{row.siteClass}</TableCell>
                       <TableCell>{row.subDomain}</TableCell>
                       <TableCell>
                         <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                           {row.cellDownName}
                         </Typography>
                       </TableCell>
                       <TableCell>
                         <Chip 
                           label={row.status} 
                           color={getStatusColor(row.status) as any}
                         />
                       </TableCell>
                       <TableCell>
                         <Box sx={{ display: 'flex', gap: 1 }}>
                           <IconButton
                             size="small"
                             onClick={() => handleViewDetail(row)}
                             color="info"
                             title="View Details"
                           >
                             <VisibilityIcon />
                           </IconButton>
                           <IconButton
                             size="small"
                             onClick={() => handleEdit(row)}
                             color="primary"
                             title="Edit Data"
                           >
                             <EditIcon />
                           </IconButton>
                         </Box>
                       </TableCell>
                     </TableRow>
                   ))}
                </TableBody>
            </Table>
          </TableContainer>
          
          {hasMore && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button 
                variant="outlined" 
                onClick={loadMoreData}
                disabled={loading}
              >
                Load More Data
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Detail View Modal */}
      <CellDownDetailView
        open={detailModal}
        onClose={() => setDetailModal(false)}
        data={selectedData}
      />
    </Box>
  );
}
