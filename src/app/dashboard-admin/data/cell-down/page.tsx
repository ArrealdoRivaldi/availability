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
  AccordionDetails,
  CircularProgress,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Upload as UploadIcon,
  Edit as EditIcon,
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  DeleteForever as DeleteForeverIcon
} from '@mui/icons-material';

// Import services and components
import { DataService } from './services/dataService';
import { UploadService } from './services/uploadService';
import { EditModal } from './components/EditModal';
import { DeleteModal } from './components/DeleteModal';
import { UploadPreviewModal } from './components/UploadPreviewModal';
import { UploadAnimationModal } from './components/UploadAnimationModal';
import { SuccessModal } from './components/SuccessModal';
import CellDownDetailView from './components/CellDownDetailView';
import ExportToExcel from './components/ExportToExcel';

// Import types and constants
import { 
  CellDownData, 
  EditModalData, 
  FilterData, 
  UploadStats, 
  ChunkProgress, 
  DeleteType, 
  SearchField 
} from './types';
import { 
  ROOT_CAUSE_OPTIONS, 
  PIC_DEPT_OPTIONS, 
  PROGRESS_OPTIONS, 
  SITE_CLASS_OPTIONS, 
  STATUS_OPTIONS, 
  CATEGORY_OPTIONS,
  SEARCH_FIELD_OPTIONS,
  ROWS_PER_PAGE_OPTIONS,
  DEFAULT_ROWS_PER_PAGE,
  SUCCESS_MESSAGE_DURATION
} from './constants';
// ===== SERVICES =====
const dataService = new DataService();
const uploadService = new UploadService();

// ===== MAIN COMPONENT =====
export default function CellDownDataPage() {
  // ===== STATE MANAGEMENT =====
  // Data states
  const [data, setData] = useState<CellDownData[]>([]);
  const [allData, setAllData] = useState<CellDownData[]>([]);
  const [filteredData, setFilteredData] = useState<CellDownData[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [totalCount, setTotalCount] = useState(0);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [filters, setFilters] = useState<FilterData>({
    week: '',
    nop: '',
    rootCause: '',
    siteClass: '',
    picDept: '',
    progress: '',
    status: '',
    rangeAgingDown: '',
    to: '',
    category: ''
  });
  const [uniqueNOPs, setUniqueNOPs] = useState<string[]>([]);
  const [uniqueWeeks, setUniqueWeeks] = useState<number[]>([]);
  const [uniqueRangeAgingDown, setUniqueRangeAgingDown] = useState<string[]>([]);
  const [uniqueTOs, setUniqueTOs] = useState<string[]>([]);
  
  // Upload states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<CellDownData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadStats, setUploadStats] = useState<UploadStats>({ 
    totalExistingData: 0,
    totalUploadedData: 0,
    totalDataAfterUpload: 0,
    currentWeek: 0,
    previousWeek: 0,
    existingOpenBeforeUpload: 0,
    existingCloseBeforeUpload: 0,
    actualCloseCount: 0,
    newlyAddedOpen: 0,
    newlyAddedClose: 0,
    totalWillBeOpen: 0,
    totalWillBeClose: 0,
    newDataCount: 0,
    updatedDataCount: 0,
    totalProcessed: 0,
    newDataWithCopy: 0
  });
  const [chunkProgress, setChunkProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [showUploadAnimation, setShowUploadAnimation] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Modal states
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
    progress: 'Open',
    to: '',
    category: ''
  });
  
  // User role state
  const [userRole, setUserRole] = useState<string>('');
  
  // Delete states
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<DeleteType>('single');
  const [itemToDelete, setItemToDelete] = useState<CellDownData | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Upload debug states
  const [columnMap, setColumnMap] = useState<{ [key: string]: number }>({});

  // ===== COMPUTED VALUES =====
  const isSuperAdmin = userRole === 'super_admin';
  

  // ===== EFFECTS =====
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role || '');
  }, []);

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

  // ===== DATA FUNCTIONS =====
  /**
   * Load all Cell Down data from the database
   */
  const loadData = async () => {
    setLoading(true);
    try {
      const allData = await dataService.loadData();
      
      // Sort by week descending (highest to lowest) by default
      const sortedData = [...allData].sort((a, b) => {
        // First sort by week (descending)
        if (b.week !== a.week) {
          return b.week - a.week;
        }
        // If weeks are equal, maintain the original order (by createdAt)
        return 0;
      });
      
      setAllData(sortedData);
      setFilteredData(sortedData);
      
      // Extract unique values for filter dropdowns
      const { nops, weeks, rangeAgingDown, tos } = dataService.extractUniqueValues(sortedData);
      
      setUniqueNOPs(nops);
      setUniqueWeeks(weeks);
      setUniqueRangeAgingDown(rangeAgingDown);
      setUniqueTOs(tos);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Apply filters to the data
   */
  const applyFilters = () => {
    const filtered = dataService.applyFilters(allData, filters, searchTerm, searchField);
    
    // Sort filtered data by week descending (highest to lowest)
    const sortedFiltered = [...filtered].sort((a, b) => {
      if (b.week !== a.week) {
        return b.week - a.week;
      }
      return 0;
    });
    
    setFilteredData(sortedFiltered);
    setPage(0);
  };

  const resetFilters = () => {
    setFilters({
      week: '',
      nop: '',
      rootCause: '',
      siteClass: '',
      picDept: '',
      progress: '',
      status: '',
      rangeAgingDown: '',
      to: '',
      category: ''
    });
    setSearchTerm('');
    setSearchField('all');
    setPage(0);
  };

  // ===== EVENT HANDLERS =====
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

  // ===== UPLOAD FUNCTIONS =====
  /**
   * Handle file upload and process Excel data
   */
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
      
      // Validate file
      uploadService.validateFile(file);
      
      // Process Excel file
      const { data: previewData, columnMap } = await uploadService.processExcelFile(file);
      
      // Analyze upload data
      const stats = await uploadService.analyzeUploadData(previewData, allData);
      
      setColumnMap(columnMap);
      setUploadStats(stats);
      setPreviewData(previewData);
      setShowPreview(true);
      setUploadStatus('');
    } catch (error) {
      console.error('Error processing file:', error);
      let errorMessage = 'Error processing file. ';
      
      if (error instanceof Error) {
        if (error.message.includes('No worksheet found')) {
          errorMessage += 'The Excel file does not contain any worksheets. Please check the file format.';
        } else if (error.message.includes('Invalid file format')) {
          errorMessage += 'Invalid Excel file format. Please use .xlsx or .xls files.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Please check the file format and try again.';
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };


  const resetUploadState = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    setPreviewData([]);
    setUploadStats({ 
      totalExistingData: 0,
      totalUploadedData: 0,
      totalDataAfterUpload: 0,
      currentWeek: 0,
      previousWeek: 0,
      existingOpenBeforeUpload: 0,
      existingCloseBeforeUpload: 0,
      actualCloseCount: 0,
      newlyAddedOpen: 0,
      newlyAddedClose: 0,
      totalWillBeOpen: 0,
      totalWillBeClose: 0,
      newDataCount: 0,
      updatedDataCount: 0,
      totalProcessed: 0,
      newDataWithCopy: 0
    });
    setChunkProgress({ current: 0, total: 0, percentage: 0 });
    setUploadStatus('');
    setUploadProgress(0);
    setUploading(false);
  };

  /**
   * Confirm and execute upload operation
   */
  const confirmUpload = async () => {
    if (!isSuperAdmin) {
      alert('Access denied. Only Super Admin users can upload data.');
      return;
    }

    if (previewData.length === 0) return;

    setShowPreview(false);
    setShowUploadAnimation(true);
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('Starting upload process...');
    
    try {
      // Upload data using service
      const { newDataCount, updatedDataCount } = await uploadService.uploadData(
        previewData, 
        allData,
        (progress, status) => {
          setUploadProgress(progress);
          setUploadStatus(status);
        }
      );

      setShowUploadAnimation(false);
      setShowSuccessMessage(true);
      
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, SUCCESS_MESSAGE_DURATION);
      
      resetUploadState();
      await loadData();
    } catch (error) {
      console.error('Error uploading data:', error);
      setShowUploadAnimation(false);
      alert('Error uploading data. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setChunkProgress({ current: 0, total: 0, percentage: 0 });
      setUploadStatus('');
    }
  };

  // ===== MODAL FUNCTIONS =====
  const handleEdit = (row: CellDownData) => {
    setSelectedData(row);
    setEditData({
      id: row.id || '',
      rootCause: row.rootCause || '',
      detailProblem: row.detailProblem || '',
      planAction: row.planAction || '',
      needSupport: row.needSupport || '',
      picDept: row.picDept || '',
      progress: row.progress || 'Open',
      to: row.to || '',
      category: row.category || ''
    });
    setEditModal(true);
  };

  /**
   * Save edited data
   */
  const handleSaveEdit = async () => {
    if (!editData.id) return;

    try {
      await dataService.updateRecord(editData.id, editData);
      
      // Update local state
      setData(prev => prev.map(item => 
        item.id === editData.id ? { ...item, ...editData } : item
      ));
      setAllData(prev => prev.map(item => 
        item.id === editData.id ? { ...item, ...editData } : item
      ));
      setFilteredData(prev => prev.map(item => 
        item.id === editData.id ? { ...item, ...editData } : item
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

  // ===== DELETE FUNCTIONS =====
  const handleDeleteSingle = (row: CellDownData) => {
    if (!isSuperAdmin) {
      alert('Access denied. Only Super Admin users can delete data.');
      return;
    }
    
    setItemToDelete(row);
    setDeleteType('single');
    setDeleteModal(true);
  };

  const handleDeleteBulk = () => {
    if (!isSuperAdmin) {
      alert('Access denied. Only Super Admin users can delete data.');
      return;
    }
    
    if (filteredData.length === 0) {
      alert('No data to delete.');
      return;
    }
    
    setDeleteType('bulk');
    setDeleteModal(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(data.map(item => item.id!));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  /**
   * Confirm and execute delete operation
   */
  const confirmDelete = async () => {
    if (!isSuperAdmin) {
      alert('Access denied. Only Super Admin users can delete data.');
      return;
    }

    setDeleting(true);
    try {
      if (deleteType === 'single' && itemToDelete) {
        // Single delete
        await dataService.deleteRecord(itemToDelete.id!);
        
        // Update local state
        setData(prev => prev.filter(item => item.id !== itemToDelete.id));
        setAllData(prev => prev.filter(item => item.id !== itemToDelete.id));
        setFilteredData(prev => prev.filter(item => item.id !== itemToDelete.id));
        
        alert('Data deleted successfully!');
      } else if (deleteType === 'bulk' && filteredData.length > 0) {
        // Bulk delete all filtered data
        const itemsToDelete = filteredData.map(item => item.id!);
        await dataService.deleteRecordsBatch(itemsToDelete);
        
        // Update local state
        setData(prev => prev.filter(item => !itemsToDelete.includes(item.id!)));
        setAllData(prev => prev.filter(item => !itemsToDelete.includes(item.id!)));
        setFilteredData(prev => prev.filter(item => !itemsToDelete.includes(item.id!)));
        
        alert(`${itemsToDelete.length} records deleted successfully!`);
        setSelectedItems([]);
      }
      
      setDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting data:', error);
      alert('Error deleting data. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // ===== UTILITY FUNCTIONS =====
  /**
   * Copy filtered data to clipboard
   */
  const handleCopyData = async () => {
    try {
      await dataService.copyToClipboard(filteredData);
      alert('Data copied to clipboard! You can paste it into Excel or any spreadsheet application.');
    } catch (error) {
      console.error('Error copying data:', error);
      alert('Error copying data. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'open' ? 'warning' : 'success';
  };

  // ===== RENDER =====
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
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
          <Typography variant="body2" color="textSecondary" sx={{ ml: 2 }}>
            Delete: {isSuperAdmin ? 'Enabled' : 'Disabled'} | Filtered: {filteredData.length} | Selected: {selectedItems.length}
          </Typography>
        </Box>
      </Box>

      {/* Upload Section */}
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
                    startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />} 
                    disabled={uploading}
                    sx={{
                      minWidth: 160,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: uploading ? 'none' : 'translateY(-2px)',
                        boxShadow: uploading ? 'none' : '0 4px 12px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    {uploading ? 'Processing...' : 'Choose Excel File'}
                  </Button>
                </label>
              </Grid>

              <Grid item>
                <Typography variant="body2" color="textSecondary">Supported formats: .xlsx, .xls</Typography>
              </Grid>
            </Grid>
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

      {/* Preview Upload Dialog */}
      <Dialog open={showPreview} onClose={() => {
        setShowPreview(false);
        resetUploadState();
      }} maxWidth="xl" fullWidth>
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
              <strong>Total Data:</strong> {allData.filter(d => d.week === uploadStats.previousWeek).length}
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
                {previewData.slice(0, 20).map((row, index) => (
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
                {previewData.length > 20 && (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ border: '1px solid #e0e0e0', padding: '16px' }}>
                      <Typography variant="body2" color="textSecondary">... and {previewData.length - 20} more records</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowPreview(false);
            resetUploadState();
          }}>Cancel</Button>
          <Button onClick={confirmUpload} variant="contained" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Confirm Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Data Dialog */}
      <Dialog open={editModal} onClose={() => setEditModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box>
            <Typography variant="h6">Edit Cell Down Data</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Cell Down Name: <strong>{selectedData?.cellDownName || 'N/A'}</strong>
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Root Cause</InputLabel>
                <Select value={editData.rootCause} onChange={(e) => setEditData({ ...editData, rootCause: e.target.value })} label="Root Cause">
                  {ROOT_CAUSE_OPTIONS.map((option) => (<MenuItem key={option} value={option}>{option}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>PIC Department</InputLabel>
                <Select value={editData.picDept} onChange={(e) => setEditData({ ...editData, picDept: e.target.value })} label="PIC Department">
                  {PIC_DEPT_OPTIONS.map((option) => (<MenuItem key={option} value={option}>{option}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Progress</InputLabel>
                <Select value={editData.progress} onChange={(e) => setEditData({ ...editData, progress: e.target.value })} label="Progress">
                  {PROGRESS_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" color={option === 'Done' ? 'success.main' : 'error.main'}>
                          {option === 'Done' ? '✅' : '❌'}
                        </Typography>
                        {option}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>TO</InputLabel>
                <Select value={editData.to || ''} onChange={(e) => setEditData({ ...editData, to: e.target.value })} label="TO">
                  <MenuItem value="">Select TO</MenuItem>
                  {uniqueTOs.map((option) => (<MenuItem key={option} value={option}>{option}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={editData.category || ''} onChange={(e) => setEditData({ ...editData, category: e.target.value })} label="Category">
                  {CATEGORY_OPTIONS.map((option) => (<MenuItem key={option} value={option}>{option}</MenuItem>))}
                </Select>
              </FormControl>
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

      {/* Data Table Section */}
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
              <Typography variant="body2" color="textSecondary">
                {isSuperAdmin && filteredData.length > 0 && `Bulk delete will remove ${filteredData.length} records`}
              </Typography>
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
                  {SEARCH_FIELD_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
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
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteForeverIcon />}
                  onClick={handleDeleteBulk}
                  size="small"
                  disabled={!isSuperAdmin || filteredData.length === 0}
                  sx={{ 
                    backgroundColor: isSuperAdmin && filteredData.length > 0 ? '#d32f2f' : '#bdbdbd',
                    '&:hover': { 
                      backgroundColor: isSuperAdmin && filteredData.length > 0 ? '#b71c1c' : '#bdbdbd' 
                    },
                    '&:disabled': {
                      backgroundColor: '#bdbdbd',
                      color: '#757575'
                    },
                    minWidth: '140px',
                    display: 'block' // Force display
                  }}
                >
                  {isSuperAdmin 
                    ? `Delete All (${filteredData.length})` 
                    : 'Delete (Super Admin Only)'
                  }
                </Button>
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
                      {ROOT_CAUSE_OPTIONS.map(option => (
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
                      {SITE_CLASS_OPTIONS.map(option => (
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
                      {PIC_DEPT_OPTIONS.map(option => (
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
                      {PROGRESS_OPTIONS.map(option => (
                        <MenuItem key={option} value={option}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" color={option === 'Done' ? 'success.main' : 'error.main'}>
                              {option === 'Done' ? '✅' : '❌'}
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
                      {STATUS_OPTIONS.map(option => (
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
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Range Aging Down</InputLabel>
                    <Select 
                      value={filters.rangeAgingDown} 
                      onChange={(e) => handleFilterChange('rangeAgingDown', e.target.value)} 
                      label="Range Aging Down"
                    >
                      <MenuItem value="">All Range Aging Down</MenuItem>
                      {uniqueRangeAgingDown.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>TO</InputLabel>
                    <Select 
                      value={filters.to} 
                      onChange={(e) => handleFilterChange('to', e.target.value)} 
                      label="TO"
                    >
                      <MenuItem value="">All TOs</MenuItem>
                      {uniqueTOs.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select 
                      value={filters.category} 
                      onChange={(e) => handleFilterChange('category', e.target.value)} 
                      label="Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {CATEGORY_OPTIONS.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
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
                        <Typography variant="h6" color={filters.progress === 'Done' ? 'success.main' : 'error.main'}>
                          {filters.progress === 'Done' ? '✅' : '❌'}
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
                {filters.rangeAgingDown && (
                  <Chip 
                    label={`Range Aging Down: ${filters.rangeAgingDown}`} 
                    size="small" 
                    onDelete={() => handleFilterChange('rangeAgingDown', '')}
                    deleteIcon={<ClearIcon />}
                  />
                )}
                {filters.to && (
                  <Chip 
                    label={`TO: ${filters.to}`} 
                    size="small" 
                    onDelete={() => handleFilterChange('to', '')}
                    deleteIcon={<ClearIcon />}
                  />
                )}
                {filters.category && (
                  <Chip 
                    label={`Category: ${filters.category}`} 
                    size="small" 
                    onDelete={() => handleFilterChange('category', '')}
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
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 50 }}>
                      <Checkbox
                        checked={selectedItems.length === data.length && data.length > 0}
                        indeterminate={selectedItems.length > 0 && selectedItems.length < data.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        color="primary"
                        disabled={!isSuperAdmin}
                      />
                    </TableCell>
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
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 120 }}>Root Cause</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 120 }}>Detail Problem</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 120 }}>Plan Action</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 120 }}>Need Support</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 100 }}>PIC Dept</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'center', minWidth: 100 }}>Progress</TableCell>
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
                        '&:nth-of-type(even)': { backgroundColor: '#fafafa' },
                        backgroundColor: selectedItems.includes(row.id!) ? '#ffebee' : 'inherit'
                      }}
                    >
                      <TableCell 
                        sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedItems.includes(row.id!)}
                          onChange={(e) => handleSelectItem(row.id!, e.target.checked)}
                          color="primary"
                          disabled={!isSuperAdmin}
                        />
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>{row.week}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px', fontWeight: 'bold' }}>{row.siteId}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 4px' }}>
                        <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.cellDownName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>{row.nop}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>{row.to || ''}</TableCell>
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
                          label={row.category || ''} 
                          color={row.category === 'Site Down' ? 'error' : 'primary'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
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
                          <Typography variant="h6" color={row.progress === 'Done' ? 'success.main' : 'error.main'}>
                            {row.progress === 'Done' ? '✅' : '❌'}
                          </Typography>
                          <Typography variant="body2" color={row.progress === 'Done' ? 'success.main' : 'error.main'}>
                            {row.progress || 'Open'}
                          </Typography>
                        </Box>
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
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
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
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSingle(row);
                              }} 
                              color="error" 
                              title={isSuperAdmin ? "Delete Data" : "Delete (Super Admin Only)"}
                              disabled={!isSuperAdmin}
                              sx={{ 
                                backgroundColor: isSuperAdmin ? '#ffebee' : '#f5f5f5',
                                '&:hover': { 
                                  backgroundColor: isSuperAdmin ? '#ffcdd2' : '#f5f5f5' 
                                },
                                '&:disabled': {
                                  backgroundColor: '#f5f5f5',
                                  color: '#bdbdbd'
                                },
                                display: 'block' // Force display
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
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
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`}
            labelRowsPerPage="Show:"
          />
        </CardContent>
      </Card>

      {/* Detail View Modal */}
      <CellDownDetailView open={detailModal} onClose={() => setDetailModal(false)} data={selectedData} />

      {/* Edit Modal */}
      <EditModal
        open={editModal}
        onClose={() => setEditModal(false)}
        onSave={handleSaveEdit}
        editData={editData}
        setEditData={setEditData}
        selectedData={selectedData}
        uniqueTOs={uniqueTOs}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={confirmDelete}
        deleteType={deleteType}
        itemToDelete={itemToDelete}
        filteredDataCount={filteredData.length}
        deleting={deleting}
      />

      {/* Upload Preview Modal */}
      <UploadPreviewModal
        open={showPreview}
        onClose={() => {
          setShowPreview(false);
          resetUploadState();
        }}
        onConfirm={confirmUpload}
        previewData={previewData}
        uploadStats={uploadStats}
        totalExistingData={allData.length}
        uploading={uploading}
      />

      {/* Upload Animation Modal */}
      <UploadAnimationModal
        open={showUploadAnimation}
        uploadProgress={uploadProgress}
        chunkProgress={chunkProgress}
        uploadStatus={uploadStatus}
      />

      {/* Success Modal */}
      <SuccessModal
        open={showSuccessMessage}
        onClose={() => setShowSuccessMessage(false)}
      />

    </Box>
  );
}
