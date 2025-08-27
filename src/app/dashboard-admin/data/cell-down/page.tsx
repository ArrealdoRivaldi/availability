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
  LinearProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TablePagination,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Upload as UploadIcon,
  Edit as EditIcon,
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import CellDownDetailView from './components/CellDownDetailView';
import ExportToExcel from './components/ExportToExcel';

import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy, where } from 'firebase/firestore';
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

interface FilterData {
  week: string;
  nop: string;
  rootCause: string;
  siteClass: string;
  picDept: string;
  progress: string;
  status: string;
}

interface UploadStats {
  newData: number;
  updatedData: number;
  totalData: number;
}

const rootCauseOptions = ['Hardware', 'Power', 'Transport', 'Comcase', 'Dismantle', 'Combat Relocation', 'IKN'];
const picDeptOptions = ['ENOM', 'NOP', 'NOS', 'SQA', 'CTO', 'RTPD', 'RTPE'];
const progressOptions = ['OPEN', 'DONE'];
const siteClassOptions = ['GOLD', 'SILVER', 'BRONZE'];
const statusOptions = ['open', 'close'];

export default function CellDownDataPage() {
  const [data, setData] = useState<CellDownData[]>([]);
  const [allData, setAllData] = useState<CellDownData[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<CellDownData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedData, setSelectedData] = useState<CellDownData | null>(null);
  const [editData, setEditData] = useState<EditModalData>({
    id: '', rootCause: '', detailProblem: '', planAction: '', needSupport: '', picDept: '', progress: 'OPEN', closedDate: ''
  });
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [userRole, setUserRole] = useState<string>('');
  const [filters, setFilters] = useState<FilterData>({
    week: '',
    nop: '',
    rootCause: '',
    siteClass: '',
    picDept: '',
    progress: '',
    status: ''
  });
  const [filteredData, setFilteredData] = useState<CellDownData[]>([]);
  const [uniqueNOPs, setUniqueNOPs] = useState<string[]>([]);
  const [uniqueWeeks, setUniqueWeeks] = useState<number[]>([]);
  
  // New state for enhanced upload functionality
  const [uploadStats, setUploadStats] = useState<UploadStats>({ newData: 0, updatedData: 0, totalData: 0 });
  const [chunkProgress, setChunkProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [uploadStatus, setUploadStatus] = useState<string>('');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role || '');
  }, []);

  const isSuperAdmin = userRole === 'super_admin';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allData, filters, searchTerm, searchField]);

  useEffect(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    setData(paginatedData);
    setTotalCount(filteredData.length);
  }, [filteredData, page, rowsPerPage]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Loading data...');
      const q = query(collection(db, 'data_celldown'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const allData: CellDownData[] = [];
      querySnapshot.forEach((doc) => {
        allData.push({ id: doc.id, ...doc.data() } as CellDownData);
      });
      
      setAllData(allData);
      setFilteredData(allData);
      
      // Extract unique NOPs for filter dropdown
      const nops = Array.from(new Set(allData.map(item => item.nop).filter(Boolean))).sort();
      setUniqueNOPs(nops);
      
      // Extract unique weeks for filter dropdown
      const weeks = Array.from(new Set(allData.map(item => item.week).filter(Boolean))).sort((a, b) => a - b);
      setUniqueWeeks(weeks);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allData];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(item => {
        if (searchField === 'all') {
          return (
            item.siteId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.nop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.cellDownName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.rootCause?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.picDept?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else {
          const fieldValue = item[searchField as keyof CellDownData];
          return fieldValue?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        }
      });
    }

    // Apply other filters
    if (filters.week) {
      filtered = filtered.filter(item => item.week?.toString() === filters.week);
    }
    if (filters.nop) {
      filtered = filtered.filter(item => item.nop === filters.nop);
    }
    if (filters.rootCause) {
      filtered = filtered.filter(item => item.rootCause === filters.rootCause);
    }
    if (filters.siteClass) {
      filtered = filtered.filter(item => item.siteClass === filters.siteClass);
    }
    if (filters.picDept) {
      filtered = filtered.filter(item => item.picDept === filters.picDept);
    }
    if (filters.progress) {
      filtered = filtered.filter(item => item.progress === filters.progress);
    }
    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    setFilteredData(filtered);
    setPage(0); // Reset to first page when filters change
  };

  const resetFilters = () => {
    setFilters({
      week: '',
      nop: '',
      rootCause: '',
      siteClass: '',
      picDept: '',
      progress: '',
      status: ''
    });
    setSearchTerm('');
    setSearchField('all');
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchFieldChange = (event: any) => {
    setSearchField(event.target.value);
  };

  const handleFilterChange = (field: keyof FilterData, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSuperAdmin) {
      alert('Access denied. Only Super Admin users can upload data.');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadStatus('Processing Excel file...');
      
      const workbook = new XLSX.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) throw new Error('No worksheet found');

      const previewRows: CellDownData[] = [];
      let rowCount = 0;
      const totalRows = worksheet.rowCount - 1;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const rowData: CellDownData = {
          week: parseInt(row.getCell(1)?.value?.toString() || '0'),
          regional: '',
          siteId: row.getCell(2)?.value?.toString() || '',
          alarmSource: '',
          nop: row.getCell(3)?.value?.toString() || '',
          districtOperation: '',
          firstOccurredOn: '',
          agingDown: parseInt(row.getCell(4)?.value?.toString() || '0'),
          rangeAgingDown: row.getCell(5)?.value?.toString() || '',
          ticketId: '',
          alarmName: '',
          siteClass: row.getCell(6)?.value?.toString() || '',
          subDomain: row.getCell(7)?.value?.toString() || '',
          alarmSeverity: '',
          alarmLocationInfo: '',
          remarkRedsector: '',
          remarkSite: '',
          cellDownName: row.getCell(8)?.value?.toString() || '',
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

      // Analyze data to determine new vs update counts
      const stats = await analyzeUploadData(previewRows);
      setUploadStats(stats);
      setPreviewData(previewRows);
      setShowPreview(true);
      setUploadStatus('');
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please check the file format.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // New function to analyze upload data
  const analyzeUploadData = async (uploadData: CellDownData[]): Promise<UploadStats> => {
    let newData = 0;
    let updatedData = 0;

    for (const item of uploadData) {
      // Check if data exists based on Week and Cell Down Name
      const existingData = allData.find(existing => 
        existing.week === item.week && 
        existing.cellDownName === item.cellDownName
      );

      if (existingData) {
        updatedData++;
      } else {
        newData++;
      }
    }

    return {
      newData,
      updatedData,
      totalData: uploadData.length
    };
  };

  const confirmUpload = async () => {
    if (!isSuperAdmin) {
      alert('Access denied. Only Super Admin users can upload data.');
      return;
    }

    if (previewData.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('Starting upload process...');
    
    try {
      const batchSize = 100;
      const totalChunks = Math.ceil(previewData.length / batchSize);
      let processed = 0;
      let newDataCount = 0;
      let updatedDataCount = 0;

      for (let i = 0; i < previewData.length; i += batchSize) {
        const currentChunk = Math.floor(i / batchSize) + 1;
        setChunkProgress({
          current: currentChunk,
          total: totalChunks,
          percentage: Math.round((currentChunk / totalChunks) * 100)
        });
        
        setUploadStatus(`Uploading chunk ${currentChunk}/${totalChunks}... ${Math.round((currentChunk / totalChunks) * 100)}%`);
        
        const batch = previewData.slice(i, i + batchSize);
        
        for (const item of batch) {
          // Check if data exists based on Week and Cell Down Name
          const existingData = allData.find(existing => 
            existing.week === item.week && 
            existing.cellDownName === item.cellDownName
          );

          if (existingData) {
            // Update existing data
            const docRef = doc(db, 'data_celldown', existingData.id!);
            const updateData = {
              ...item,
              id: existingData.id,
              updatedAt: new Date(),
              status: 'close' // Update status to close for existing data
            };
            
            await updateDoc(docRef, updateData);
            updatedDataCount++;
          } else {
            // Add new data
            const newItem = {
              ...item,
              status: 'open', // New data starts with open status
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            await addDoc(collection(db, 'data_celldown'), newItem);
            newDataCount++;
          }
          
          processed++;
          setUploadProgress((processed / previewData.length) * 100);
        }
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Show success message with detailed information
      const successMessage = `Upload berhasil! 
        - Data baru yang ditambahkan: ${newDataCount}
        - Data yang diupdate: ${updatedDataCount}
        - Total data yang diproses: ${previewData.length}`;
      
      alert(successMessage);
      
      setShowPreview(false);
      setPreviewData([]);
      setUploadStats({ newData: 0, updatedData: 0, totalData: 0 });
      setChunkProgress({ current: 0, total: 0, percentage: 0 });
      setUploadStatus('');
      
      // Reload data to show updated information
      loadData();
    } catch (error) {
      console.error('Error uploading data:', error);
      alert('Error uploading data. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setChunkProgress({ current: 0, total: 0, percentage: 0 });
      setUploadStatus('');
    }
  };

  const handleEdit = (row: CellDownData) => {
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

  const handleCopyData = async () => {
    try {
      const dataToCopy = filteredData.map(item => ({
        Week: item.week,
        'Site ID': item.siteId,
        'Cell Down Name': item.cellDownName,
        NOP: item.nop,
        'Aging Down': item.agingDown,
        'Range Aging Down': item.rangeAgingDown,
        'Site Class': item.siteClass,
        'Sub Domain': item.subDomain,
        'Root Cause': item.rootCause || '',
        'Detail Problem': item.detailProblem || '',
        'Plan Action': item.planAction || '',
        'Need Support': item.needSupport || '',
        'PIC Dept': item.picDept || '',
        Progress: item.progress || 'OPEN',
        'Closed Date': item.closedDate || '',
        Status: item.status
      }));

      const csvContent = [
        Object.keys(dataToCopy[0]).join(','),
        ...dataToCopy.map(row => Object.values(row).map(value => `"${value}"`).join(','))
      ].join('\n');

      await navigator.clipboard.writeText(csvContent);
      alert('Data copied to clipboard! You can paste it into Excel or any spreadsheet application.');
    } catch (error) {
      console.error('Error copying data:', error);
      alert('Error copying data. Please try again.');
    }
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
      
      setData(prev => prev.map(item => 
        item.id === editData.id ? { ...item, ...updateData } : item
      ));
      
      setEditModal(false);
      alert('Data updated successfully!');
    } catch (error) {
      console.error('Error updating data:', error);
      alert('Error updating data. Please try again.');
    }
  };

  const handleRowClick = (row: CellDownData) => {
    setSelectedData(row);
    setDetailModal(true);
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
          <Typography variant="body2" color="textSecondary">Role:</Typography>
          <Chip 
            label={userRole || 'Loading...'} 
            color={isSuperAdmin ? 'success' : 'default'}
            size="small"
          />
        </Box>
      </Box>

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
                  <Button variant="contained" component="span" startIcon={<UploadIcon />} disabled={uploading}>
                    Choose Excel File
                  </Button>
                </label>
              </Grid>

              <Grid item>
                <Typography variant="body2" color="textSecondary">Supported formats: .xlsx, .xls</Typography>
              </Grid>
            </Grid>
            
            {uploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {uploadStatus || `Processing: ${Math.round(uploadProgress)}%`}
                </Typography>
                
                {/* Chunk Progress Display */}
                {chunkProgress.total > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="primary">
                      Chunk Progress: {chunkProgress.current}/{chunkProgress.total} ({chunkProgress.percentage}%)
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={chunkProgress.percentage} 
                      sx={{ mt: 0.5 }}
                      color="secondary"
                    />
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Access Restricted" avatar={<CloudUploadIcon />} subheader="Upload functionality is restricted to Super Admin users only" />
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body1" color="textSecondary" gutterBottom>You need Super Admin privileges to upload data.</Typography>
              <Typography variant="body2" color="textSecondary">Contact your administrator if you need access to this feature.</Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="xl" fullWidth>
        <DialogTitle>
          Preview Upload Data ({previewData.length} records)
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
              Data baru yang akan ditambahkan: {uploadStats.newData}
            </Typography>
            <Typography variant="body2" color="secondary" sx={{ fontWeight: 'bold' }}>
              Data yang akan diupdate: {uploadStats.updatedData}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total data yang akan diproses: {uploadStats.totalData}
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
                  <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 100 }}>AGING DOWN</TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 140 }}>RANGE AGING DOWN</TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 100 }}>SITE CLASS</TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 120 }}>Sub Domain</TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 120 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.slice(0, 20).map((row, index) => {
                  // Check if this row will be new or updated
                  const isNewData = !allData.find(existing => 
                    existing.week === row.week && 
                    existing.cellDownName === row.cellDownName
                  );
                  
                  return (
                    <TableRow key={index} sx={{ 
                      '&:nth-of-type(even)': { backgroundColor: '#fafafa' },
                      backgroundColor: isNewData ? '#e8f5e8' : '#fff3e0'
                    }}>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>{index + 1}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>{row.week}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px', fontWeight: 'bold' }}>{row.siteId}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 4px' }}>{row.cellDownName}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>{row.nop}</TableCell>
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
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>{row.subDomain}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>
                        <Chip 
                          label={isNewData ? 'New Data' : 'Update'} 
                          color={isNewData ? 'success' : 'warning'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {previewData.length > 20 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ border: '1px solid #e0e0e0', padding: '16px' }}>
                      <Typography variant="body2" color="textSecondary">... and {previewData.length - 20} more records</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Cancel</Button>
          <Button onClick={confirmUpload} variant="contained" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Confirm Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editModal} onClose={() => setEditModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Cell Down Data</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Root Cause</InputLabel>
                <Select value={editData.rootCause} onChange={(e) => setEditData({ ...editData, rootCause: e.target.value })} label="Root Cause">
                  {rootCauseOptions.map((option) => (<MenuItem key={option} value={option}>{option}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>PIC Department</InputLabel>
                <Select value={editData.picDept} onChange={(e) => setEditData({ ...editData, picDept: e.target.value })} label="PIC Department">
                  {picDeptOptions.map((option) => (<MenuItem key={option} value={option}>{option}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Progress</InputLabel>
                <Select value={editData.progress} onChange={(e) => setEditData({ ...editData, progress: e.target.value })} label="Progress">
                  {progressOptions.map((option) => (<MenuItem key={option} value={option}>{option}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Closed Date" type="date" value={editData.closedDate} onChange={(e) => setEditData({ ...editData, closedDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Detail Problem" value={editData.detailProblem} onChange={(e) => setEditData({ ...editData, detailProblem: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Plan Action" value={editData.planAction} onChange={(e) => setEditData({ ...editData, planAction: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Need Support" value={editData.needSupport} onChange={(e) => setEditData({ ...editData, needSupport: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModal(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      <Card>
        <CardHeader
          title={
            <Box>
              <Typography variant="h6">Cell Down Data</Typography>
              <Typography variant="body2" color="textSecondary">
                {filteredData.length === allData.length 
                  ? `${filteredData.length} records` 
                  : `${filteredData.length} of ${allData.length} records (filtered)`
                }
              </Typography>
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyData}
                size="small"
              >
                Copy Data
              </Button>
              <ExportToExcel data={filteredData} onExport={() => {}} />
            </Box>
          }
        />
        
        <CardContent sx={{ pb: 0 }}>
          {/* Search Section */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search data..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Search Field</InputLabel>
                <Select value={searchField} onChange={handleSearchFieldChange} label="Search Field">
                  <MenuItem value="all">All Fields</MenuItem>
                  <MenuItem value="siteId">Site ID</MenuItem>
                  <MenuItem value="nop">NOP</MenuItem>
                  <MenuItem value="cellDownName">Cell Down Name</MenuItem>
                  <MenuItem value="rootCause">Root Cause</MenuItem>
                  <MenuItem value="picDept">PIC Dept</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={resetFilters}
                size="small"
                fullWidth
              >
                Reset
              </Button>
            </Grid>
          </Grid>

          {/* Filters Section */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterListIcon />
                <Typography variant="subtitle1">Filters</Typography>
                <Chip 
                  label={`${Object.values(filters).filter(f => f !== '').length} active`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {loading ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>Loading filters...</Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Week</InputLabel>
                    <Select 
                      value={filters.week} 
                      onChange={(e) => handleFilterChange('week', e.target.value)} 
                      label="Week"
                    >
                      <MenuItem value="">All Weeks</MenuItem>
                      {uniqueWeeks.map(week => (
                        <MenuItem key={week} value={week.toString()}>{week}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>NOP</InputLabel>
                    <Select 
                      value={filters.nop} 
                      onChange={(e) => handleFilterChange('nop', e.target.value)} 
                      label="NOP"
                    >
                      <MenuItem value="">All NOPs</MenuItem>
                      {uniqueNOPs.map(nop => (
                        <MenuItem key={nop} value={nop}>{nop}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Root Cause</InputLabel>
                    <Select 
                      value={filters.rootCause} 
                      onChange={(e) => handleFilterChange('rootCause', e.target.value)} 
                      label="Root Cause"
                    >
                      <MenuItem value="">All Root Causes</MenuItem>
                      {rootCauseOptions.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Site Class</InputLabel>
                    <Select 
                      value={filters.siteClass} 
                      onChange={(e) => handleFilterChange('siteClass', e.target.value)} 
                      label="Site Class"
                    >
                      <MenuItem value="">All Site Classes</MenuItem>
                      {siteClassOptions.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>PIC Department</InputLabel>
                    <Select 
                      value={filters.picDept} 
                      onChange={(e) => handleFilterChange('picDept', e.target.value)} 
                      label="PIC Department"
                    >
                      <MenuItem value="">All PIC Departments</MenuItem>
                      {picDeptOptions.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Progress</InputLabel>
                    <Select 
                      value={filters.progress} 
                      onChange={(e) => handleFilterChange('progress', e.target.value)} 
                      label="Progress"
                    >
                      <MenuItem value="">All Progress</MenuItem>
                      {progressOptions.map(option => (
                        <MenuItem key={option} value={option}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" color={option === 'DONE' ? 'success.main' : 'error.main'}>
                              {option === 'DONE' ? '✅' : '❌'}
                            </Typography>
                            {option}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select 
                      value={filters.status} 
                      onChange={(e) => handleFilterChange('status', e.target.value)} 
                      label="Status"
                    >
                      <MenuItem value="">All Status</MenuItem>
                      {statusOptions.map(option => (
                        <MenuItem key={option} value={option}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" color={option === 'close' ? 'success.main' : 'error.main'}>
                              {option === 'close' ? '✅' : '❌'}
                            </Typography>
                            {option}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                </Grid>
              )}
            </AccordionDetails>
          </Accordion>
        </CardContent>
        
        <CardContent>
          {loading && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>Loading data...</Typography>
            </Box>
          )}
          
          {!loading && data.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>No data found</Typography>
              <Typography variant="body2" color="textSecondary">
                {allData.length === 0 ? 'No records in the database.' : 'No records match your search criteria.'}
              </Typography>
            </Box>
          )}
          
          {/* Active Filters Summary */}
          {Object.values(filters).some(f => f !== '') && (
            <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterListIcon fontSize="small" />
                Active Filters:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {filters.week && (
                  <Chip 
                    label={`Week: ${filters.week}`} 
                    size="small" 
                    onDelete={() => handleFilterChange('week', '')}
                    deleteIcon={<ClearIcon />}
                  />
                )}
                {filters.nop && (
                  <Chip 
                    label={`NOP: ${filters.nop}`} 
                    size="small" 
                    onDelete={() => handleFilterChange('nop', '')}
                    deleteIcon={<ClearIcon />}
                  />
                )}
                {filters.rootCause && (
                  <Chip 
                    label={`Root Cause: ${filters.rootCause}`} 
                    size="small" 
                    onDelete={() => handleFilterChange('rootCause', '')}
                    deleteIcon={<ClearIcon />}
                  />
                )}
                {filters.siteClass && (
                  <Chip 
                    label={`Site Class: ${filters.siteClass}`} 
                    size="small" 
                    onDelete={() => handleFilterChange('siteClass', '')}
                    deleteIcon={<ClearIcon />}
                  />
                )}
                {filters.picDept && (
                  <Chip 
                    label={`PIC: ${filters.picDept}`} 
                    size="small" 
                    onDelete={() => handleFilterChange('picDept', '')}
                    deleteIcon={<ClearIcon />}
                  />
                )}
                {filters.progress && (
                  <Chip 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" color={filters.progress === 'DONE' ? 'success.main' : 'error.main'}>
                          {filters.progress === 'DONE' ? '✅' : '❌'}
                        </Typography>
                        <Typography variant="body2">Progress: {filters.progress}</Typography>
                      </Box>
                    }
                    size="small" 
                    onDelete={() => handleFilterChange('progress', '')}
                    deleteIcon={<ClearIcon />}
                  />
                )}
                {filters.status && (
                  <Chip 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" color={filters.status === 'close' ? 'success.main' : 'error.main'}>
                          {filters.status === 'close' ? '✅' : '❌'}
                        </Typography>
                        <Typography variant="body2">Status: {filters.status}</Typography>
                      </Box>
                    }
                    size="small" 
                    onDelete={() => handleFilterChange('status', '')}
                    deleteIcon={<ClearIcon />}
                  />
                )}
              </Box>
            </Box>
          )}

          {!loading && data.length > 0 && (
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader size="small" sx={{ borderCollapse: 'collapse' }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 60 }}>No.</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 80 }}>Week</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 100 }}>Site ID</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 150 }}>Cell Down Name</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 120 }}>NOP</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 100 }}>AGING DOWN</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 140 }}>RANGE AGING DOWN</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 100 }}>SITE CLASS</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 120 }}>Sub Domain</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 120 }}>Root Cause</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 120 }}>Detail Problem</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 120 }}>Plan Action</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 120 }}>Need Support</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 100 }}>PIC Dept</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 100 }}>Progress</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 120 }}>Closed Date</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 80 }}>Status</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 120 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow 
                      key={row.id} 
                      hover 
                      onClick={() => handleRowClick(row)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f0f8ff' },
                        '&:nth-of-type(even)': { backgroundColor: '#fafafa' }
                      }}
                    >
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>{row.week}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px', fontWeight: 'bold' }}>{row.siteId}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 4px' }}>
                        <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.cellDownName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>{row.nop}</TableCell>
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
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>{row.subDomain}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 4px' }}>
                        <Typography variant="body2" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.rootCause || ''}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 4px' }}>
                        <Typography variant="body2" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.detailProblem || ''}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 4px' }}>
                        <Typography variant="body2" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.planAction || ''}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 4px' }}>
                        <Typography variant="body2" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.needSupport || ''}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 4px' }}>
                        <Typography variant="body2" sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.picDept || ''}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <Typography variant="h6" color={row.progress === 'DONE' ? 'success.main' : 'error.main'}>
                            {row.progress === 'DONE' ? '✅' : '❌'}
                          </Typography>
                          <Typography variant="body2" color={row.progress === 'DONE' ? 'success.main' : 'error.main'}>
                            {row.progress || 'OPEN'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>
                        <Typography variant="body2">{row.closedDate || ''}</Typography>
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <Typography variant="h6" color={row.status === 'close' ? 'success.main' : 'error.main'}>
                            {row.status === 'close' ? '✅' : '❌'}
                          </Typography>
                          <Typography variant="body2" color={row.status === 'close' ? 'success.main' : 'error.main'}>
                            {row.status}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(row);
                          }} 
                          color="primary" 
                          title="Edit Data"
                          sx={{ 
                            backgroundColor: '#e8f5e8',
                            '&:hover': { backgroundColor: '#c8e6c9' }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          <TablePagination
            component="div"
            count={filteredData.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[25, 50, 100]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`}
            labelRowsPerPage="Show:"
          />
        </CardContent>
      </Card>

      <CellDownDetailView open={detailModal} onClose={() => setDetailModal(false)} data={selectedData} />
    </Box>
  );
}
