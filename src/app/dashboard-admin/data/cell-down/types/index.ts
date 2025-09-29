/**
 * Type definitions for Cell Down Data Management
 * Contains all interfaces and type definitions used throughout the application
 */

// ===== MAIN DATA INTERFACE =====
export interface CellDownData {
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

// ===== EDIT MODAL DATA INTERFACE =====
export interface EditModalData {
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

// ===== FILTER DATA INTERFACE =====
export interface FilterData {
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

// ===== UPLOAD STATISTICS INTERFACE =====
export interface UploadStats {
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

// ===== CHUNK PROGRESS INTERFACE =====
export interface ChunkProgress {
  current: number;
  total: number;
  percentage: number;
}

// ===== COLUMN MAPPING INTERFACE =====
export interface ColumnMap {
  [key: string]: number;
}

// ===== DELETE MODAL TYPE =====
export type DeleteType = 'single' | 'bulk';

// ===== SEARCH FIELD TYPE =====
export type SearchField = 'all' | 'siteId' | 'nop' | 'cellDownName' | 'rootCause' | 'picDept';
