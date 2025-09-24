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
  AccordionDetails,
  CircularProgress
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
  DeleteForever as DeleteForeverIcon,
  Checkbox,
  CheckboxOutlineBlank
} from '@mui/icons-material';
import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy, deleteDoc, writeBatch } from 'firebase/firestore';
import * as XLSX from 'exceljs';

import CellDownDetailView from './components/CellDownDetailView';
import ExportToExcel from './components/ExportToExcel';
import { db } from '@/app/firebaseConfig';
// ===== INTERFACES =====
interface CellDownData {
  id?: string;
  week: number;
  siteId: string;
  cellDownName: string;
  nop: string;
  agingDown: number;
  rangeAgingDown: string;
  siteClass: string;
  subDomain: string;
  to: string;
  category: string;
  rootCause: string;
  detailProblem: string;
  planAction: string;
  needSupport: string;
  picDept: string;
  progress: string;
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
  to: string;
  category: string;
}

interface FilterData {
  week: string;
  nop: string;
  rootCause: string;
  siteClass: string;
  picDept: string;
  progress: string;
  status: string;
  rangeAgingDown: string;
  to: string;
  category: string;
}

interface UploadStats {
  totalExistingData: number;
  totalUploadedData: number;
  totalDataAfterUpload: number;
  currentWeek: number;
  previousWeek: number;
  existingOpenBeforeUpload: number;
  existingCloseBeforeUpload: number;
  actualCloseCount: number;
  newlyAddedOpen: number;
  newlyAddedClose: number;
  totalWillBeOpen: number;
  totalWillBeClose: number;
  newDataCount: number;
  updatedDataCount: number;
  totalProcessed: number;
  newDataWithCopy: number;
}

// ===== CONSTANTS =====
const rootCauseOptions = ['Power', 'Transport', 'Comcase', 'Dismantle', 'Combat Relocation', 'IKN', 'Radio', 'Trial Lock', 'Database', 'Vandalism'];
const picDeptOptions = ['ENOM', 'NOP', 'NOS', 'SQA', 'CTO', 'RTPD', 'RTPE'];
const progressOptions = ['Open', 'Waiting Budget', 'Waiting Spare Part', 'Waiting Permit', 'Followup Comcase', 'IKN', 'Waiting Delete DB', 'Waiting team', 'Trial Lock', 'Waiting SVA', 'Waiting Support PIC DEPT', 'Done'];
const siteClassOptions = ['GOLD', 'SILVER', 'BRONZE'];
const statusOptions = ['open', 'close'];
const categoryOptions = ['Site Down', 'Cell Down'];

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
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('all');
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
  const [deleteType, setDeleteType] = useState<'single' | 'bulk'>('single');
  const [itemToDelete, setItemToDelete] = useState<CellDownData | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Upload debug states
  const [columnMap, setColumnMap] = useState<{ [key: string]: number }>({});

  // ===== COMPUTED VALUES =====
  const isSuperAdmin = userRole === 'super_admin';
  
  // Debug logging
  console.log('User role:', userRole);
  console.log('Is Super Admin:', isSuperAdmin);

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
  const loadData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'data_celldown'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const allData: CellDownData[] = [];
      
      querySnapshot.forEach((doc) => {
        allData.push({ id: doc.id, ...doc.data() } as CellDownData);
      });
      
      setAllData(allData);
      setFilteredData(allData);
      
      // Extract unique values for filter dropdowns
      const nops = Array.from(new Set(allData.map(item => item.nop).filter(Boolean))).sort();
      const weeks = Array.from(new Set(allData.map(item => item.week).filter(Boolean))).sort((a, b) => a - b);
      const rangeAgingDown = Array.from(new Set(allData.map(item => item.rangeAgingDown).filter(Boolean))).sort();
      const tos = Array.from(new Set(allData.map(item => item.to).filter(Boolean))).sort();
      
      setUniqueNOPs(nops);
      setUniqueWeeks(weeks);
      setUniqueRangeAgingDown(rangeAgingDown);
      setUniqueTOs(tos);
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
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(item => {
          const fieldValue = item[key as keyof CellDownData];
          return fieldValue?.toString() === value;
        });
      }
    });

    setFilteredData(filtered);
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
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSuperAdmin) {
      alert('Access denied. Only Super Admin users can upload data.');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      alert('Please select a valid Excel file (.xlsx or .xls format).');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadStatus('Processing Excel file...');
      
      const workbook = new XLSX.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      
      const worksheet = workbook.worksheets[0] || workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('No worksheet found. Please ensure the Excel file contains at least one worksheet.');
      }

      if (!worksheet.rowCount || worksheet.rowCount <= 1) {
        throw new Error('The worksheet is empty or contains only headers. Please ensure the Excel file contains data rows.');
      }

      // Get header row to map columns dynamically
      const headerRow = worksheet.getRow(1);
      const columnMap: { [key: string]: number } = {};
      
      // Map column headers to column numbers
      headerRow.eachCell((cell, colNumber) => {
        const headerValue = cell.value?.toString().toLowerCase().trim();
        console.log(`Column ${colNumber}: "${headerValue}"`); // Debug log
        
        if (headerValue) {
          // Map various possible header names to our data fields
          if (headerValue.includes('week') || headerValue.includes('minggu')) {
            columnMap['week'] = colNumber;
            console.log(`Mapped week to column ${colNumber}`);
          } else if (headerValue.includes('site') && headerValue.includes('id')) {
            columnMap['siteId'] = colNumber;
            console.log(`Mapped siteId to column ${colNumber}`);
          } else if (headerValue.includes('cell') && headerValue.includes('down') && headerValue.includes('name')) {
            columnMap['cellDownName'] = colNumber;
            console.log(`Mapped cellDownName to column ${colNumber}`);
          } else if (headerValue.includes('nop')) {
            columnMap['nop'] = colNumber;
            console.log(`Mapped nop to column ${colNumber}`);
          } else if (headerValue === 'to' || headerValue.includes('to') || headerValue.includes('t.o')) {
            columnMap['to'] = colNumber;
            console.log(`Mapped to to column ${colNumber}`);
          } else if (headerValue.includes('aging') && headerValue.includes('down')) {
            columnMap['agingDown'] = colNumber;
            console.log(`Mapped agingDown to column ${colNumber}`);
          } else if (headerValue.includes('range') && headerValue.includes('aging')) {
            columnMap['rangeAgingDown'] = colNumber;
            console.log(`Mapped rangeAgingDown to column ${colNumber}`);
          } else if (headerValue.includes('site') && headerValue.includes('class')) {
            columnMap['siteClass'] = colNumber;
            console.log(`Mapped siteClass to column ${colNumber}`);
          } else if (headerValue.includes('sub') && headerValue.includes('domain')) {
            columnMap['subDomain'] = colNumber;
            console.log(`Mapped subDomain to column ${colNumber}`);
          } else if (headerValue.includes('category') || headerValue.includes('kategori') || headerValue === 'cat') {
            columnMap['category'] = colNumber;
            console.log(`Mapped category to column ${colNumber}`);
          }
        }
      });

      // Validate required columns
      const requiredColumns = ['week', 'siteId', 'cellDownName', 'nop'];
      const missingColumns = requiredColumns.filter(col => !columnMap[col]);
      
      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}. Please ensure your Excel file has the correct headers.`);
      }

      // Log detected column mapping for debugging
      console.log('Detected column mapping:', columnMap);
      
      // Show warning if TO or Category columns are not detected
      if (!columnMap['to']) {
        console.warn('TO column not detected. Available headers:', headerRow.values);
        // Try to find TO column by position (usually column 5 or 6)
        if (headerRow.getCell(5)?.value) {
          columnMap['to'] = 5;
          console.log('Fallback: Mapped TO to column 5');
        } else if (headerRow.getCell(6)?.value) {
          columnMap['to'] = 6;
          console.log('Fallback: Mapped TO to column 6');
        }
      }
      if (!columnMap['category']) {
        console.warn('Category column not detected. Available headers:', headerRow.values);
        // Try to find Category column by position (usually column 10 or 11)
        if (headerRow.getCell(10)?.value) {
          columnMap['category'] = 10;
          console.log('Fallback: Mapped Category to column 10');
        } else if (headerRow.getCell(11)?.value) {
          columnMap['category'] = 11;
          console.log('Fallback: Mapped Category to column 11');
        }
      }
      
      // Save column mapping to state for preview dialog
      setColumnMap(columnMap);

      const previewRows: CellDownData[] = [];
      let rowCount = 0;
      const totalRows = worksheet.rowCount - 1;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const getCellValue = (columnName: string): string => {
          const colNum = columnMap[columnName];
          return colNum ? (row.getCell(colNum)?.value?.toString() || '') : '';
        };

        const getCellNumber = (columnName: string): number => {
          const colNum = columnMap[columnName];
          return colNum ? parseInt(row.getCell(colNum)?.value?.toString() || '0') : 0;
        };

        const rowData: CellDownData = {
          week: getCellNumber('week'),
          siteId: getCellValue('siteId'),
          cellDownName: getCellValue('cellDownName'),
          nop: getCellValue('nop'),
          to: getCellValue('to'),
          agingDown: getCellNumber('agingDown'),
          rangeAgingDown: getCellValue('rangeAgingDown'),
          siteClass: getCellValue('siteClass'),
          subDomain: getCellValue('subDomain'),
          category: getCellValue('category'),
          rootCause: '',
          detailProblem: '',
          planAction: '',
          needSupport: '',
          picDept: '',
          progress: 'Open',
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        previewRows.push(rowData);
        rowCount++;
        setUploadProgress((rowCount / totalRows) * 100);
      });

      const stats = await analyzeUploadData(previewRows);
      setUploadStats(stats);
      setPreviewData(previewRows);
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

  const analyzeUploadData = async (uploadData: CellDownData[]): Promise<UploadStats> => {
    const currentWeek = uploadData.length > 0 ? uploadData[0].week : 0;
    const targetWeek = currentWeek - 1;

    const totalExistingData = allData.length;
    const previousWeekData = allData.filter(d => d.week === targetWeek);
    const existingOpenBeforeUpload = previousWeekData.filter(d => d.status === 'open').length;
    const existingCloseBeforeUpload = previousWeekData.filter(d => d.status === 'close').length;

    const uploadCellDownNames = new Set(uploadData.map(item => item.cellDownName));
    const simulatedDataMap = new Map<string, CellDownData>();
    allData.forEach(d => simulatedDataMap.set(`${d.week}-${d.cellDownName}`, { ...d }));

    let newDataCount = 0;
    let updatedDataCount = 0;
    let newlyAddedOpen = 0;
    let newlyAddedClose = 0;

    // Process uploaded data to identify new/updated records
    for (const uploadedItem of uploadData) {
      const key = `${uploadedItem.week}-${uploadedItem.cellDownName}`;
      const existingData = allData.find(existing => 
        existing.week === uploadedItem.week && 
        existing.cellDownName === uploadedItem.cellDownName
      );

      if (existingData) {
        // Existing data - check for previous week data to copy fields
        const currentWeek = uploadedItem.week;
        const previousWeek = currentWeek - 1;
        const existingWithSameName = allData.find(existing => 
          existing.cellDownName === uploadedItem.cellDownName && 
          existing.week === previousWeek
        );
        
        const updatedItem = {
          ...existingData,
          ...uploadedItem,
          rootCause: existingWithSameName?.rootCause || existingData.rootCause || '',
          detailProblem: existingWithSameName?.detailProblem || existingData.detailProblem || '',
          planAction: existingWithSameName?.planAction || existingData.planAction || '',
          needSupport: existingWithSameName?.needSupport || existingData.needSupport || '',
          picDept: existingWithSameName?.picDept || existingData.picDept || '',
          progress: existingWithSameName?.progress || existingData.progress || 'OPEN',
          to: existingWithSameName?.to || existingData.to || '',
          category: existingWithSameName?.category || existingData.category || '',
          status: 'open'
        };
        
        updatedDataCount++;
        simulatedDataMap.set(key, updatedItem);
      } else {
        // New data - check for previous week data to copy fields
        const currentWeek = uploadedItem.week;
        const previousWeek = currentWeek - 1;
        const existingWithSameName = allData.find(existing => 
          existing.cellDownName === uploadedItem.cellDownName && 
          existing.week === previousWeek
        );
        
        newDataCount++;
        newlyAddedOpen++;
        
        const simulatedNewItem = {
          ...uploadedItem,
          rootCause: existingWithSameName?.rootCause || '',
          detailProblem: existingWithSameName?.detailProblem || '',
          planAction: existingWithSameName?.planAction || '',
          needSupport: existingWithSameName?.needSupport || '',
          picDept: existingWithSameName?.picDept || '',
          progress: existingWithSameName?.progress || 'OPEN',
          to: existingWithSameName?.to || '',
          category: existingWithSameName?.category || '',
          status: 'open'
        };
        
        simulatedDataMap.set(key, simulatedNewItem);
      }
    }

    // Apply status logic based on Cell Down Name
    const finalSimulatedData: CellDownData[] = [];
    const simulatedDataArray = Array.from(simulatedDataMap.entries());

    for (const [key, dataItem] of simulatedDataArray) {
      let finalStatus = dataItem.status;

      if (dataItem.week === targetWeek) {
        const cellDownNameInUpload = uploadCellDownNames.has(dataItem.cellDownName);
        finalStatus = cellDownNameInUpload ? 'open' : 'close';
      }
      
      finalSimulatedData.push({ ...dataItem, status: finalStatus });
    }

    const totalDataAfterUpload = finalSimulatedData.length;
    const totalWillBeOpen = finalSimulatedData.filter(d => d.status === 'open').length;
    const totalWillBeClose = finalSimulatedData.filter(d => d.status === 'close').length;
    
    // Calculate actual close count for previous week after status logic
    const previousWeekAfterLogic = finalSimulatedData.filter(d => d.week === targetWeek);
    const actualCloseCount = previousWeekAfterLogic.filter(d => d.status === 'close').length;

    const newDataWithCopy = uploadData.filter(item => {
      const currentWeek = item.week;
      const previousWeek = currentWeek - 1;
      const hasExistingWithSameNameInPreviousWeek = allData.find(existing =>
        existing.cellDownName === item.cellDownName &&
        existing.week === previousWeek
      );
      return hasExistingWithSameNameInPreviousWeek;
    }).length;

    return {
      totalExistingData,
      totalUploadedData: uploadData.length,
      totalDataAfterUpload,
      currentWeek,
      previousWeek: targetWeek,
      existingOpenBeforeUpload,
      existingCloseBeforeUpload,
      actualCloseCount,
      newlyAddedOpen,
      newlyAddedClose,
      totalWillBeOpen,
      totalWillBeClose,
      newDataCount,
      updatedDataCount,
      totalProcessed: uploadData.length,
      newDataWithCopy,
    };
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
      const batchSize = 100;
      const totalChunks = Math.ceil(previewData.length / batchSize);
      let processed = 0;
      let newDataCount = 0;
      let updatedDataCount = 0;

      // Process data in batches
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
          const existingData = allData.find(existing => 
            existing.week === item.week && 
            existing.cellDownName === item.cellDownName
          );

          if (existingData) {
            // Update existing data with copied fields from previous week
            const currentWeek = item.week;
            const previousWeek = currentWeek - 1;
            const existingWithSameName = allData.find(existing => 
              existing.cellDownName === item.cellDownName && 
              existing.week === previousWeek
            );
            
            const docRef = doc(db, 'data_celldown', existingData.id!);
            const updateData = {
              ...item,
              id: existingData.id,
              rootCause: existingWithSameName?.rootCause || existingData.rootCause || '',
              detailProblem: existingWithSameName?.detailProblem || existingData.detailProblem || '',
              planAction: existingWithSameName?.planAction || existingData.planAction || '',
              needSupport: existingWithSameName?.needSupport || existingData.needSupport || '',
              picDept: existingWithSameName?.picDept || existingData.picDept || '',
              progress: existingWithSameName?.progress || existingData.progress || 'OPEN',
              to: existingWithSameName?.to || existingData.to || '',
              category: existingWithSameName?.category || existingData.category || '',
              updatedAt: new Date(),
              status: 'open'
            };
            
            await updateDoc(docRef, updateData);
            updatedDataCount++;
          } else {
            // Add new data with copied fields from previous week
            const currentWeek = item.week;
            const previousWeek = currentWeek - 1;
            const existingWithSameName = allData.find(existing => 
              existing.cellDownName === item.cellDownName && 
              existing.week === previousWeek
            );
            
            const newItem = {
              ...item,
              rootCause: existingWithSameName?.rootCause || '',
              detailProblem: existingWithSameName?.detailProblem || '',
              planAction: existingWithSameName?.planAction || '',
              needSupport: existingWithSameName?.needSupport || '',
              picDept: existingWithSameName?.picDept || '',
              progress: existingWithSameName?.progress || 'OPEN',
              to: existingWithSameName?.to || '',
              category: existingWithSameName?.category || '',
              status: 'open',
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            await addDoc(collection(db, 'data_celldown'), newItem);
            newDataCount++;
          }
          
          processed++;
          setUploadProgress((processed / previewData.length) * 100);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update status of existing data based on upload
      const uploadCellDownNames = new Set(previewData.map(item => item.cellDownName));
      const currentWeek = previewData.length > 0 ? previewData[0].week : 0;
      const targetWeek = currentWeek - 1;
      
      for (const existingItem of allData) {
        let newStatus = existingItem.status;
        
        if (existingItem.week === targetWeek) {
          const cellDownNameInUpload = uploadCellDownNames.has(existingItem.cellDownName);
          newStatus = cellDownNameInUpload ? 'open' : 'close';
        }
        
        if (newStatus !== existingItem.status) {
          const docRef = doc(db, 'data_celldown', existingItem.id!);
          await updateDoc(docRef, {
            status: newStatus,
            updatedAt: new Date()
          });
        }
      }

      setShowUploadAnimation(false);
      setShowSuccessMessage(true);
      
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      resetUploadState();
      loadData();
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

  const handleSaveEdit = async () => {
    if (!editData.id) return;

    try {
      const docRef = doc(db, 'data_celldown', editData.id);
      const updateData = {
        ...editData,
        updatedAt: new Date()
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

  const confirmDelete = async () => {
    if (!isSuperAdmin) {
      alert('Access denied. Only Super Admin users can delete data.');
      return;
    }

    setDeleting(true);
    try {
      if (deleteType === 'single' && itemToDelete) {
        // Single delete
        await deleteDoc(doc(db, 'data_celldown', itemToDelete.id!));
        
        // Update local state
        setData(prev => prev.filter(item => item.id !== itemToDelete.id));
        setAllData(prev => prev.filter(item => item.id !== itemToDelete.id));
        setFilteredData(prev => prev.filter(item => item.id !== itemToDelete.id));
        
        alert('Data deleted successfully!');
      } else if (deleteType === 'bulk' && filteredData.length > 0) {
        // Bulk delete all filtered data using batch
        const batch = writeBatch(db);
        const itemsToDelete = filteredData.map(item => item.id!);
        
        itemsToDelete.forEach(itemId => {
          const docRef = doc(db, 'data_celldown', itemId);
          batch.delete(docRef);
        });
        
        await batch.commit();
        
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
        'TO': item.to || '',
        'Category': item.category || '',
        'Root Cause': item.rootCause || '',
        'Detail Problem': item.detailProblem || '',
        'Plan Action': item.planAction || '',
        'Need Support': item.needSupport || '',
        'PIC Dept': item.picDept || '',
        Progress: item.progress || 'Open',
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
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontStyle: 'italic' }}>
              ✅ Kolom terdeteksi berdasarkan header Excel (posisi kolom fleksibel)
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
              TO: {columnMap['to'] ? `Kolom ${columnMap['to']}` : 'Tidak terdeteksi'} | 
              Category: {columnMap['category'] ? `Kolom ${columnMap['category']}` : 'Tidak terdeteksi'}
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
                  {progressOptions.map((option) => (
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
                  {categoryOptions.map((option) => (<MenuItem key={option} value={option}>{option}</MenuItem>))}
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
                    minWidth: '140px'
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
                      {categoryOptions.map(option => (
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
                              }
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
            rowsPerPageOptions={[25, 50, 100]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`}
            labelRowsPerPage="Show:"
          />
        </CardContent>
      </Card>

      {/* Detail View Modal */}
      <CellDownDetailView open={detailModal} onClose={() => setDetailModal(false)} data={selectedData} />

      {/* Delete Confirmation Modal */}
      <Dialog 
        open={deleteModal} 
        onClose={() => !deleting && setDeleteModal(false)} 
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
          {/* Warning Icon */}
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
              : `Are you sure you want to delete ALL ${filteredData.length} filtered records? This action cannot be undone and will delete all data that matches your current search/filter criteria.`
            }
          </Typography>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => setDeleteModal(false)}
              disabled={deleting}
              sx={{ minWidth: 100 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={confirmDelete}
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

      {/* Upload Animation Dialog */}
      <Dialog 
        open={showUploadAnimation} 
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

      {/* Success Message Dialog */}
      <Dialog 
        open={showSuccessMessage} 
        onClose={() => setShowSuccessMessage(false)} 
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
            Upload Berhasil!
          </Typography>
          
          <Typography variant="body1" color="textSecondary">
            Data berhasil diupload ke sistem
          </Typography>
        </Box>
      </Dialog>
    </Box>
  );
}
