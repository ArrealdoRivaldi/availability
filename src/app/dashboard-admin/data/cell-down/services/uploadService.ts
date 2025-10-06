/**
 * Upload Service for Cell Down Data Management
 * Handles Excel file processing and data upload operations
 */

import * as XLSX from 'exceljs';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '@/app/firebaseConfig';
import { CellDownData, UploadStats, ColumnMap } from '../types';
import { 
  ALLOWED_FILE_TYPES, 
  ALLOWED_FILE_EXTENSIONS, 
  REQUIRED_COLUMNS, 
  COLUMN_MAPPING_PATTERNS,
  UPLOAD_BATCH_SIZE,
  UPLOAD_DELAY_MS,
  DEFAULT_PROGRESS,
  DEFAULT_STATUS
} from '../constants';

/**
 * Upload Service Class
 * Contains all methods for handling file uploads and data processing
 */
export class UploadService {
  private readonly collectionName = 'data_celldown';

  /**
   * Validate uploaded file
   * @param file - File to validate
   * @throws Error if file is invalid
   */
  validateFile(file: File): void {
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type) && !file.name.match(ALLOWED_FILE_EXTENSIONS)) {
      throw new Error('Please select a valid Excel file (.xlsx or .xls format).');
    }
  }

  /**
   * Process Excel file and extract data
   * @param file - Excel file to process
   * @returns Promise<{ data: CellDownData[], columnMap: ColumnMap }>
   */
  async processExcelFile(file: File): Promise<{ data: CellDownData[], columnMap: ColumnMap }> {
    try {
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
      const columnMap = this.mapColumns(worksheet);
      
      // Validate required columns
      this.validateRequiredColumns(columnMap);

      // Extract data from worksheet
      const data = this.extractDataFromWorksheet(worksheet, columnMap);

      return { data, columnMap };
    } catch (error) {
      console.error('Error processing file:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error processing file. Please check the file format and try again.');
    }
  }

  /**
   * Map column headers to column numbers
   * @param worksheet - Excel worksheet
   * @returns ColumnMap object
   */
  private mapColumns(worksheet: XLSX.Worksheet): ColumnMap {
    const headerRow = worksheet.getRow(1);
    const columnMap: ColumnMap = {};
    
    // Map column headers to column numbers with precise matching
    headerRow.eachCell((cell, colNumber) => {
      const headerValue = cell.value?.toString().toLowerCase().trim();
      
      if (headerValue) {
        // Map various possible header names to our data fields with priority-based matching
        Object.entries(COLUMN_MAPPING_PATTERNS).forEach(([field, patterns]) => {
          // Skip if already mapped
          if (columnMap[field]) return;
          
          // Check patterns in order of specificity
          const isMatch = patterns.some(pattern => {
            // Check for exact match first
            if (headerValue === pattern) return true;
            // Check for close match (replacing spaces, underscores, etc.)
            const normalizedHeader = headerValue.replace(/[_\s-]/g, '');
            const normalizedPattern = pattern.replace(/[_\s-]/g, '');
            if (normalizedHeader === normalizedPattern) return true;
            // Check if header contains the pattern as a complete word
            const words = headerValue.split(/[\s_-]+/);
            return words.some(word => word === pattern);
          });
          
          if (isMatch) {
            columnMap[field] = colNumber;
          }
        });
      }
    });

    // Try to find missing columns by position
    this.fillMissingColumns(headerRow, columnMap);

    return columnMap;
  }

  /**
   * Fill missing columns by trying common positions
   * @param headerRow - Header row from worksheet
   * @param columnMap - Column mapping object to update
   */
  private fillMissingColumns(headerRow: XLSX.Row, columnMap: ColumnMap): void {
    // Try to find TO column by position (usually column 5, 6, or 7)
    if (!columnMap['to']) {
      if (headerRow.getCell(5)?.value) {
        columnMap['to'] = 5;
      } else if (headerRow.getCell(6)?.value) {
        columnMap['to'] = 6;
      } else if (headerRow.getCell(7)?.value) {
        columnMap['to'] = 7;
      }
    }

    // Try to find Category column by position (usually column 10 or 11)
    if (!columnMap['category']) {
      if (headerRow.getCell(10)?.value) {
        columnMap['category'] = 10;
      } else if (headerRow.getCell(11)?.value) {
        columnMap['category'] = 11;
      }
    }

    // Try to find Range Aging Down column by position (usually column 8)
    if (!columnMap['rangeAgingDown']) {
      if (headerRow.getCell(8)?.value) {
        columnMap['rangeAgingDown'] = 8;
      } else if (headerRow.getCell(9)?.value) {
        columnMap['rangeAgingDown'] = 9;
      }
    }
  }

  /**
   * Validate that all required columns are present
   * @param columnMap - Column mapping object
   * @throws Error if required columns are missing
   */
  private validateRequiredColumns(columnMap: ColumnMap): void {
    const missingColumns = REQUIRED_COLUMNS.filter(col => !columnMap[col]);
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}. Please ensure your Excel file has the correct headers.`);
    }
  }

  /**
   * Extract data from worksheet using column mapping
   * @param worksheet - Excel worksheet
   * @param columnMap - Column mapping object
   * @returns Array of CellDownData
   */
  private extractDataFromWorksheet(worksheet: XLSX.Worksheet, columnMap: ColumnMap): CellDownData[] {
    const data: CellDownData[] = [];
    const totalRows = worksheet.rowCount - 1;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

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
        progress: DEFAULT_PROGRESS,
        status: DEFAULT_STATUS,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      data.push(rowData);
    });

    return data;
  }

  /**
   * Analyze upload data and calculate statistics
   * @param uploadData - Data to be uploaded
   * @param existingData - Current data in database
   * @returns UploadStats object
   */
  async analyzeUploadData(uploadData: CellDownData[], existingData: CellDownData[]): Promise<UploadStats> {
    const currentWeek = uploadData.length > 0 ? uploadData[0].week : 0;
    const targetWeek = currentWeek - 1;

    const totalExistingData = existingData.length;
    const previousWeekData = existingData.filter(d => d.week === targetWeek);
    const existingOpenBeforeUpload = previousWeekData.filter(d => d.status === 'open').length;
    const existingCloseBeforeUpload = previousWeekData.filter(d => d.status === 'close').length;

    const uploadCellDownNames = new Set(uploadData.map(item => item.cellDownName));
    const simulatedDataMap = new Map<string, CellDownData>();
    existingData.forEach(d => simulatedDataMap.set(`${d.week}-${d.cellDownName}`, { ...d }));

    let newDataCount = 0;
    let updatedDataCount = 0;
    let newlyAddedOpen = 0;
    let newlyAddedClose = 0;

    // Process uploaded data to identify new/updated records
    for (const uploadedItem of uploadData) {
      const key = `${uploadedItem.week}-${uploadedItem.cellDownName}`;
      const existingItem = existingData.find(existing => 
        existing.week === uploadedItem.week && 
        existing.cellDownName === uploadedItem.cellDownName
      );

      if (existingItem) {
        // Existing data - check for previous week data to copy fields
        const currentWeek = uploadedItem.week;
        const previousWeek = currentWeek - 1;
        const existingWithSameName = existingData.find(existing => 
          existing.cellDownName === uploadedItem.cellDownName && 
          existing.week === previousWeek
        );
        
        const updatedItem = {
          ...existingItem,
          ...uploadedItem,
          rootCause: existingWithSameName?.rootCause || existingItem.rootCause || '',
          detailProblem: existingWithSameName?.detailProblem || existingItem.detailProblem || '',
          planAction: existingWithSameName?.planAction || existingItem.planAction || '',
          needSupport: existingWithSameName?.needSupport || existingItem.needSupport || '',
          picDept: existingWithSameName?.picDept || existingItem.picDept || '',
          progress: existingWithSameName?.progress || existingItem.progress || DEFAULT_PROGRESS,
          to: uploadedItem.to || existingWithSameName?.to || existingItem.to || '',
          category: uploadedItem.category || existingWithSameName?.category || existingItem.category || '',
          status: DEFAULT_STATUS
        };
        
        updatedDataCount++;
        simulatedDataMap.set(key, updatedItem);
      } else {
        // New data - check for previous week data to copy fields
        const currentWeek = uploadedItem.week;
        const previousWeek = currentWeek - 1;
        const existingWithSameName = existingData.find(existing => 
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
          progress: existingWithSameName?.progress || DEFAULT_PROGRESS,
          to: uploadedItem.to || existingWithSameName?.to || '',
          category: uploadedItem.category || existingWithSameName?.category || '',
          status: DEFAULT_STATUS
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
      const hasExistingWithSameNameInPreviousWeek = existingData.find(existing =>
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
  }

  /**
   * Upload data to Firestore in batches
   * @param uploadData - Data to upload
   * @param existingData - Current data in database
   * @param onProgress - Progress callback function
   * @returns Promise<{ newDataCount: number, updatedDataCount: number }>
   */
  async uploadData(
    uploadData: CellDownData[], 
    existingData: CellDownData[],
    onProgress: (progress: number, status: string) => void
  ): Promise<{ newDataCount: number, updatedDataCount: number }> {
    let processed = 0;
    let newDataCount = 0;
    let updatedDataCount = 0;

    // Process data in batches
    for (let i = 0; i < uploadData.length; i += UPLOAD_BATCH_SIZE) {
      const currentChunk = Math.floor(i / UPLOAD_BATCH_SIZE) + 1;
      const totalChunks = Math.ceil(uploadData.length / UPLOAD_BATCH_SIZE);
      
      onProgress(
        Math.round((currentChunk / totalChunks) * 100),
        `Uploading chunk ${currentChunk}/${totalChunks}... ${Math.round((currentChunk / totalChunks) * 100)}%`
      );
      
      const batch = uploadData.slice(i, i + UPLOAD_BATCH_SIZE);
      
      for (const item of batch) {
        const existingItem = existingData.find(existing => 
          existing.week === item.week && 
          existing.cellDownName === item.cellDownName
        );

        if (existingItem) {
          // Update existing data with copied fields from previous week
          const currentWeek = item.week;
          const previousWeek = currentWeek - 1;
          const existingWithSameName = existingData.find(existing => 
            existing.cellDownName === item.cellDownName && 
            existing.week === previousWeek
          );
          
          const docRef = doc(db, this.collectionName, existingItem.id!);
          const updateData = {
            ...item,
            id: existingItem.id,
            rootCause: existingWithSameName?.rootCause || existingItem.rootCause || '',
            detailProblem: existingWithSameName?.detailProblem || existingItem.detailProblem || '',
            planAction: existingWithSameName?.planAction || existingItem.planAction || '',
            needSupport: existingWithSameName?.needSupport || existingItem.needSupport || '',
            picDept: existingWithSameName?.picDept || existingItem.picDept || '',
            progress: existingWithSameName?.progress || existingItem.progress || DEFAULT_PROGRESS,
            to: item.to || existingWithSameName?.to || existingItem.to || '',
            category: item.category || existingWithSameName?.category || existingItem.category || '',
            updatedAt: new Date(),
            status: DEFAULT_STATUS
          };
          
          await updateDoc(docRef, updateData);
          updatedDataCount++;
        } else {
          // Add new data with copied fields from previous week
          const currentWeek = item.week;
          const previousWeek = currentWeek - 1;
          const existingWithSameName = existingData.find(existing => 
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
            progress: existingWithSameName?.progress || DEFAULT_PROGRESS,
            to: item.to || existingWithSameName?.to || '',
            category: item.category || existingWithSameName?.category || '',
            status: DEFAULT_STATUS,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await addDoc(collection(db, this.collectionName), newItem);
          newDataCount++;
        }
        
        processed++;
        onProgress((processed / uploadData.length) * 100, 'Processing data...');
      }
      
      await new Promise(resolve => setTimeout(resolve, UPLOAD_DELAY_MS));
    }

    // Update status of existing data based on upload
    await this.updateExistingDataStatus(uploadData, existingData);

    return { newDataCount, updatedDataCount };
  }

  /**
   * Update status of existing data based on upload
   * @param uploadData - Uploaded data
   * @param existingData - Current data in database
   */
  private async updateExistingDataStatus(uploadData: CellDownData[], existingData: CellDownData[]): Promise<void> {
    const uploadCellDownNames = new Set(uploadData.map(item => item.cellDownName));
    const currentWeek = uploadData.length > 0 ? uploadData[0].week : 0;
    const targetWeek = currentWeek - 1;
    
    for (const existingItem of existingData) {
      let newStatus = existingItem.status;
      
      if (existingItem.week === targetWeek) {
        const cellDownNameInUpload = uploadCellDownNames.has(existingItem.cellDownName);
        newStatus = cellDownNameInUpload ? 'open' : 'close';
      }
      
      if (newStatus !== existingItem.status) {
        const docRef = doc(db, this.collectionName, existingItem.id!);
        await updateDoc(docRef, {
          status: newStatus,
          updatedAt: new Date()
        });
      }
    }
  }
}
