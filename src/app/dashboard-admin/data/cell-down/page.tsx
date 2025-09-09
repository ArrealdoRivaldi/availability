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
  siteId: string;
  cellDownName: string;
  nop: string;
  agingDown: number;
  rangeAgingDown: string;
  siteClass: string;
  subDomain: string;
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
  rangeAgingDown: string;
}

interface UploadStats {
  totalExistingData: number;
  totalUploadedData: number;
  totalDataAfterUpload: number;
  currentWeek: number;
  previousWeek: number;
  existingOpenBeforeUpload: number;
  existingCloseBeforeUpload: number;
  newlyAddedOpen: number;
  newlyAddedClose: number;
  totalWillBeOpen: number;
  totalWillBeClose: number;
  newDataCount: number;
  updatedDataCount: number;
  totalProcessed: number;
  newDataWithCopy: number;
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
    status: '',
    rangeAgingDown: ''
  });
  const [filteredData, setFilteredData] = useState<CellDownData[]>([]);
  const [uniqueNOPs, setUniqueNOPs] = useState<string[]>([]);
  const [uniqueWeeks, setUniqueWeeks] = useState<number[]>([]);
  const [uniqueRangeAgingDown, setUniqueRangeAgingDown] = useState<string[]>([]);
  
  // New state for enhanced upload functionality
  const [uploadStats, setUploadStats] = useState<UploadStats>({ 
    totalExistingData: 0,
    totalUploadedData: 0,
    totalDataAfterUpload: 0,
    currentWeek: 0,
    previousWeek: 0,
    existingOpenBeforeUpload: 0,
    existingCloseBeforeUpload: 0,
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
      
      // Extract unique range aging down for filter dropdown
      const rangeAgingDown = Array.from(new Set(allData.map(item => item.rangeAgingDown).filter(Boolean))).sort();
      setUniqueRangeAgingDown(rangeAgingDown);
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
    if (filters.rangeAgingDown) {
      filtered = filtered.filter(item => item.rangeAgingDown === filters.rangeAgingDown);
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
      status: '',
      rangeAgingDown: ''
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

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
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
      
      // Get the first worksheet by name or index
      const worksheet = workbook.worksheets[0] || workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('No worksheet found. Please ensure the Excel file contains at least one worksheet.');
      }

      // Check if worksheet has data
      if (!worksheet.rowCount || worksheet.rowCount <= 1) {
        throw new Error('The worksheet is empty or contains only headers. Please ensure the Excel file contains data rows.');
      }

      const previewRows: CellDownData[] = [];
      let rowCount = 0;
      const totalRows = worksheet.rowCount - 1;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const rowData: CellDownData = {
          week: parseInt(row.getCell(2)?.value?.toString() || '0'), // Kolom B: Week
          siteId: row.getCell(3)?.value?.toString() || '', // Kolom C: Site ID
          cellDownName: row.getCell(4)?.value?.toString() || '', // Kolom D: Cell Down Name
          nop: row.getCell(5)?.value?.toString() || '', // Kolom E: NOP
          agingDown: parseInt(row.getCell(6)?.value?.toString() || '0'), // Kolom F: AGING DOWN
          rangeAgingDown: row.getCell(7)?.value?.toString() || '', // Kolom G: RANGE AGING DOWN
          siteClass: row.getCell(8)?.value?.toString() || '', // Kolom H: SITE CLASS
          subDomain: row.getCell(9)?.value?.toString() || '', // Kolom I: Sub Domain
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

  // Enhanced function to analyze upload data with status prediction
  // Logika baru berdasarkan Week dan Cell Down Name:
  // - Cek data existing di kolom week (yaitu angka terbesar)
  // - Cocokan data yang upload dan data existing yaitu kolom Cell Down Name
  // - Jika data cocok data di kolom status isinya Open
  // - Jika data tidak cocok data di kolom status isinya Close
  const analyzeUploadData = async (uploadData: CellDownData[]): Promise<UploadStats> => {
    const currentWeek = uploadData.length > 0 ? uploadData[0].week : 0; // Week yang diupload
    const targetWeek = currentWeek - 1; // Week yang akan diupdate (1 tingkat di bawah week upload)

    // 1. Hitungan awal dari data yang sudah ada (existing)
    const totalExistingData = allData.length;
    const existingOpenBeforeUpload = allData.filter(d => d.status === 'open').length;
    const existingCloseBeforeUpload = allData.filter(d => d.status === 'close').length;

    // Buat set untuk pencarian efisien data yang diupload berdasarkan Cell Down Name
    const uploadCellDownNames = new Set(uploadData.map(item => item.cellDownName));

    // Buat salinan sementara dari semua data untuk mensimulasikan perubahan
    const simulatedDataMap = new Map<string, CellDownData>();
    allData.forEach(d => simulatedDataMap.set(`${d.week}-${d.cellDownName}`, { ...d })); // Deep copy data existing

    let newDataCount = 0;
    let updatedDataCount = 0;
    let newlyAddedOpen = 0;
    let newlyAddedClose = 0;

    // --- Proses data yang diupload untuk mengidentifikasi data baru/diperbarui ---
    for (const uploadedItem of uploadData) {
      const key = `${uploadedItem.week}-${uploadedItem.cellDownName}`;
      const existingData = allData.find(existing => 
        existing.week === uploadedItem.week && 
        existing.cellDownName === uploadedItem.cellDownName
      );

      if (existingData) {
        // Data sudah ada di database dengan week dan cellDownName yang sama
        updatedDataCount++;
        simulatedDataMap.set(key, { ...existingData, ...uploadedItem, status: 'open' });
      } else {
        // Ini adalah record yang benar-benar baru
        // Cari data existing dengan Cell Down Name yang sama di week sebelumnya untuk copy field
        const currentWeek = uploadedItem.week;
        const previousWeek = currentWeek - 1;
        const existingWithSameName = allData.find(existing => 
          existing.cellDownName === uploadedItem.cellDownName && 
          existing.week === previousWeek
        );
        
        newDataCount++;
        newlyAddedOpen++; // Data baru selalu 'Open'
        
        // Simulasi data baru dengan field yang dicopy dari data existing di week sebelumnya
        const simulatedNewItem = {
          ...uploadedItem,
          rootCause: existingWithSameName?.rootCause || '',
          detailProblem: existingWithSameName?.detailProblem || '',
          planAction: existingWithSameName?.planAction || '',
          needSupport: existingWithSameName?.needSupport || '',
          picDept: existingWithSameName?.picDept || '',
          progress: existingWithSameName?.progress || 'OPEN',
          status: 'open'
        };
        
        simulatedDataMap.set(key, simulatedNewItem);
      }
    }

    // --- Terapkan logika baru untuk menentukan status berdasarkan Cell Down Name ---
    const finalSimulatedData: CellDownData[] = [];
    const simulatedDataArray = Array.from(simulatedDataMap.entries());

    for (const [key, dataItem] of simulatedDataArray) {
      let finalStatus = dataItem.status; // Mulai dengan status saat ini/awal

      // Hanya update status untuk week yang 1 tingkat di bawah week upload
      if (dataItem.week === targetWeek) {
        // Periksa apakah Cell Down Name ini ada di data yang diupload
        const cellDownNameInUpload = uploadCellDownNames.has(dataItem.cellDownName);
        
        if (cellDownNameInUpload) {
          finalStatus = 'open'; // Jika ada di upload -> status open
        } else {
          finalStatus = 'close'; // Jika tidak ada di upload -> status close
        }
      }
      
      finalSimulatedData.push({ ...dataItem, status: finalStatus });
    }

    const totalDataAfterUpload = finalSimulatedData.length;
    const totalWillBeOpen = finalSimulatedData.filter(d => d.status === 'open').length;
    const totalWillBeClose = finalSimulatedData.filter(d => d.status === 'close').length;

    // Hitung berapa banyak data baru yang akan copy data lama dari week sebelumnya
    const newDataWithCopy = uploadData.filter(item => {
      const isNewData = !allData.find(existing => 
        existing.week === item.week && 
        existing.cellDownName === item.cellDownName
      );
      const currentWeek = item.week;
      const previousWeek = currentWeek - 1;
      const hasExistingWithSameNameInPreviousWeek = allData.find(existing => 
        existing.cellDownName === item.cellDownName && 
        existing.week === previousWeek
      );
      return isNewData && hasExistingWithSameNameInPreviousWeek;
    }).length;

    return {
      totalExistingData,
      totalUploadedData: uploadData.length,
      totalDataAfterUpload,
      currentWeek,
      previousWeek: targetWeek,
      existingOpenBeforeUpload,
      existingCloseBeforeUpload,
      newlyAddedOpen,
      newlyAddedClose,
      totalWillBeOpen,
      totalWillBeClose,
      newDataCount,
      updatedDataCount,
      totalProcessed: uploadData.length,
      newDataWithCopy, // Tambahkan field baru
    };
  };

  // New function to reset file input and upload state
  const resetUploadState = () => {
    // Reset file input element
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    // Reset all upload-related state
    setPreviewData([]);
    setUploadStats({ 
      totalExistingData: 0,
      totalUploadedData: 0,
      totalDataAfterUpload: 0,
      currentWeek: 0,
      previousWeek: 0,
      existingOpenBeforeUpload: 0,
      existingCloseBeforeUpload: 0,
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

    // Close preview and show upload animation
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
              status: 'open' // Update status to open for existing data (karena akan diupdate)
            };
            
            await updateDoc(docRef, updateData);
            updatedDataCount++;
          } else {
            // Check if there's existing data with the same Cell Down Name in the previous week
            const currentWeek = item.week;
            const previousWeek = currentWeek - 1;
            const existingWithSameName = allData.find(existing => 
              existing.cellDownName === item.cellDownName && 
              existing.week === previousWeek
            );
            
            // Add new data with copied fields from existing data with same Cell Down Name in previous week
            const newItem = {
              ...item,
              // Copy existing data fields if Cell Down Name exists in previous week
              rootCause: existingWithSameName?.rootCause || '',
              detailProblem: existingWithSameName?.detailProblem || '',
              planAction: existingWithSameName?.planAction || '',
              needSupport: existingWithSameName?.needSupport || '',
              picDept: existingWithSameName?.picDept || '',
              progress: existingWithSameName?.progress || 'OPEN', // Copy progress from existing data
              status: 'open', // New data always starts with 'open' status
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

      // Update status of existing data based on new logic
      const uploadCellDownNames = new Set(previewData.map(item => item.cellDownName));
      
      // Get current week from upload data
      const currentWeek = previewData.length > 0 ? previewData[0].week : 0;
      const targetWeek = currentWeek - 1; // Week yang akan diupdate (1 tingkat di bawah week upload)
      
      for (const existingItem of allData) {
        let newStatus = existingItem.status; // Default to current status
        
        // Hanya update status untuk week yang 1 tingkat di bawah week upload
        if (existingItem.week === targetWeek) {
          // Periksa apakah Cell Down Name ini ada di data yang diupload
          const cellDownNameInUpload = uploadCellDownNames.has(existingItem.cellDownName);
          
          if (cellDownNameInUpload) {
            newStatus = 'open'; // Jika ada di upload -> status open
          } else {
            newStatus = 'close'; // Jika tidak ada di upload -> status close
          }
        }
        
        // Update status if it changed
        if (newStatus !== existingItem.status) {
          const docRef = doc(db, 'data_celldown', existingItem.id!);
          await updateDoc(docRef, {
            status: newStatus,
            updatedAt: new Date()
          });
        }
      }

      // Show success message with clean UI
      setShowUploadAnimation(false);
      setShowSuccessMessage(true);
      
      // Auto hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      resetUploadState();
      
      // Reload data to show updated information
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

      <Dialog open={showPreview} onClose={() => {
        setShowPreview(false);
        resetUploadState();
      }} maxWidth="xl" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Preview Upload Data
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="info.main" sx={{ fontWeight: 'bold', mb: 1 }}>
              Week: {uploadStats.currentWeek}
            </Typography>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
              Total Data yang di upload: {uploadStats.totalUploadedData}
            </Typography>
            
            {/* Statistik detail */}
            <Box sx={{ mb: 2, p: 2, backgroundColor: '#e8f5e8', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'success.main' }}>
                📊 Statistik Upload:
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    • Data Baru: {uploadStats.newDataCount}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    • Data Update: {uploadStats.updatedDataCount}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="info.main" sx={{ fontWeight: 'bold' }}>
                    • Akan Copy dari Week Sebelumnya: {uploadStats.newDataWithCopy}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    • Data Baru Murni: {uploadStats.newDataCount - uploadStats.newDataWithCopy}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            
            {/* Legend untuk warna baris */}
            <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Keterangan Warna Baris:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: '#e8f5e8', border: '1px solid #4caf50' }}></Box>
                  <Typography variant="body2">Data Baru (tanpa copy data lama)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: '#e3f2fd', border: '1px solid #2196f3' }}></Box>
                  <Typography variant="body2">Data Baru (akan copy data dari week sebelumnya)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: '#fff3e0', border: '1px solid #ff9800' }}></Box>
                  <Typography variant="body2">Data Existing (akan diupdate)</Typography>
                </Box>
              </Box>
            </Box>
            
            {/* Week-by-week breakdown */}
            {(() => {
              const weeks = Array.from(new Set(allData.map(d => d.week))).sort((a, b) => a - b);
              const currentWeek = uploadStats.currentWeek;
              const targetWeek = uploadStats.previousWeek;
              const uploadCellDownNames = new Set(previewData.map(item => item.cellDownName));
              
              return weeks.map(week => {
                const weekData = allData.filter(d => d.week === week);
                const isTargetWeek = week === targetWeek;
                const isCurrentWeek = week === currentWeek;
                
                let openCount, closeCount;
                
                if (isTargetWeek) {
                  // Untuk target week, hitung berdasarkan prediksi setelah upload
                  openCount = weekData.filter(d => uploadCellDownNames.has(d.cellDownName)).length;
                  closeCount = weekData.filter(d => !uploadCellDownNames.has(d.cellDownName)).length;
                } else {
                  // Untuk week lain, gunakan status saat ini
                  openCount = weekData.filter(d => d.status === 'open').length;
                  closeCount = weekData.filter(d => d.status === 'close').length;
                }
                
                return (
                  <Box key={week} sx={{ 
                    mt: 1, 
                    p: 2, 
                    backgroundColor: isTargetWeek ? '#fff3e0' : isCurrentWeek ? '#e8f5e8' : '#f5f5f5', 
                    borderRadius: 2,
                    border: isTargetWeek ? '2px solid #ff9800' : isCurrentWeek ? '2px solid #4caf50' : '1px solid #e0e0e0'
                  }}>
                    <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Week {week} {isTargetWeek ? '(Akan Diupdate)' : isCurrentWeek ? '(Data Upload)' : ''}
                    </Typography>
                    <Typography variant="body2" color="warning.main" sx={{ ml: 2 }}>
                      • Total Data Week {week} Open: {openCount}
                    </Typography>
                    <Typography variant="body2" color="success.main" sx={{ ml: 2 }}>
                      • Total Data Week {week} Close: {closeCount}
                    </Typography>
                    {isTargetWeek && (
                      <Typography variant="body2" color="info.main" sx={{ ml: 2, mt: 1, fontStyle: 'italic' }}>
                        * Status data di week ini akan diupdate berdasarkan Cell Down Name yang ada di upload
                      </Typography>
                    )}
                  </Box>
                );
              });
            })()}
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
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.slice(0, 20).map((row, index) => {
                  // Check if this row will be new or updated
                  const isNewData = !allData.find(existing => 
                    existing.week === row.week && 
                    existing.cellDownName === row.cellDownName
                  );
                  
                  // Check if new data will copy from existing data in previous week
                  const currentWeek = row.week;
                  const previousWeek = currentWeek - 1;
                  const willCopyFromExisting = isNewData && allData.find(existing => 
                    existing.cellDownName === row.cellDownName && 
                    existing.week === previousWeek
                  );
                  
                  return (
                    <TableRow key={index} sx={{ 
                      '&:nth-of-type(even)': { backgroundColor: '#fafafa' },
                      backgroundColor: isNewData ? (willCopyFromExisting ? '#e3f2fd' : '#e8f5e8') : '#fff3e0'
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
                      <TableCell sx={{ border: '1px solid #e0e0e0', textAlign: 'center', padding: '8px 4px' }}>
                        {row.subDomain}
                        {willCopyFromExisting && (
                          <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                            📋 Akan copy dari week {previousWeek}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {previewData.length > 20 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ border: '1px solid #e0e0e0', padding: '16px' }}>
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
                {filters.rangeAgingDown && (
                  <Chip 
                    label={`Range Aging Down: ${filters.rangeAgingDown}`} 
                    size="small" 
                    onDelete={() => handleFilterChange('rangeAgingDown', '')}
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
