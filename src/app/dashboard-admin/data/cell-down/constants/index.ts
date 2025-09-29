/**
 * Constants for Cell Down Data Management
 * Contains all static values and configuration options used throughout the application
 */

// ===== DROPDOWN OPTIONS =====
export const ROOT_CAUSE_OPTIONS = [
  'Power',
  'Transport', 
  'Comcase',
  'Dismantle',
  'Combat Relocation',
  'IKN',
  'Radio',
  'Trial Lock',
  'Database',
  'Vandalism'
];

export const PIC_DEPT_OPTIONS = [
  'ENOM',
  'NOP',
  'NOS',
  'SQA',
  'CTO',
  'RTPD',
  'RTPE'
];

export const PROGRESS_OPTIONS = [
  'Open',
  'Waiting Budget',
  'Waiting Spare Part',
  'Waiting Permit',
  'Followup Comcase',
  'IKN',
  'Waiting Delete DB',
  'Waiting team',
  'Trial Lock',
  'Waiting SVA',
  'Waiting Support PIC DEPT',
  'Done'
];

export const SITE_CLASS_OPTIONS = [
  'GOLD',
  'SILVER',
  'BRONZE'
];

export const STATUS_OPTIONS = [
  'open',
  'close'
];

export const CATEGORY_OPTIONS = [
  'Site Down',
  'Cell Down'
];

// ===== SEARCH FIELD OPTIONS =====
export const SEARCH_FIELD_OPTIONS = [
  { value: 'all', label: 'All Fields' },
  { value: 'siteId', label: 'Site ID' },
  { value: 'nop', label: 'NOP' },
  { value: 'cellDownName', label: 'Cell Down Name' },
  { value: 'rootCause', label: 'Root Cause' },
  { value: 'picDept', label: 'PIC Dept' }
];

// ===== PAGINATION OPTIONS =====
export const ROWS_PER_PAGE_OPTIONS = [25, 50, 100];
export const DEFAULT_ROWS_PER_PAGE = 50;

// ===== UPLOAD CONFIGURATION =====
export const UPLOAD_BATCH_SIZE = 100;
export const UPLOAD_DELAY_MS = 100;

// ===== FILE VALIDATION =====
export const ALLOWED_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
];

export const ALLOWED_FILE_EXTENSIONS = /\.(xlsx|xls)$/i;

// ===== REQUIRED COLUMNS FOR UPLOAD =====
export const REQUIRED_COLUMNS = ['week', 'siteId', 'cellDownName', 'nop'];

// ===== COLUMN MAPPING PATTERNS =====
export const COLUMN_MAPPING_PATTERNS = {
  week: ['week', 'minggu'],
  siteId: ['site', 'id'],
  cellDownName: ['cell', 'down', 'name'],
  nop: ['nop'],
  to: ['to', 't.o', 't o'],
  agingDown: ['aging', 'down'],
  rangeAgingDown: ['range', 'aging', 'range', 'down'],
  siteClass: ['site', 'class'],
  subDomain: ['sub', 'domain'],
  category: ['category', 'kategori', 'cat']
};

// ===== DEFAULT VALUES =====
export const DEFAULT_PROGRESS = 'Open';
export const DEFAULT_STATUS = 'open';

// ===== UI CONFIGURATION =====
export const TABLE_MAX_HEIGHT = 600;
export const PREVIEW_MAX_ROWS = 20;
export const SUCCESS_MESSAGE_DURATION = 3000;
