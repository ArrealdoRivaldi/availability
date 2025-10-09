/**
 * Data Service for Cell Down Management
 * Handles all CRUD operations and data manipulation for Cell Down data
 * Now uses Realtime Database instead of Firestore
 */

import { 
  ref, 
  get, 
  set, 
  remove, 
  push, 
  update,
  query,
  orderByChild,
  orderByKey,
  limitToLast,
  startAfter,
  endBefore
} from 'firebase/database';
import { cellDownDatabase } from '@/app/firebaseConfig';
import { CellDownData, FilterData } from '../types';

/**
 * Data Service Class
 * Contains all methods for managing Cell Down data
 */
export class DataService {
  private readonly collectionName = 'data_celldown';

  /**
   * Load all Cell Down data from Realtime Database
   * @returns Promise<CellDownData[]> - Array of all Cell Down records
   */
  async loadData(): Promise<CellDownData[]> {
    try {
      if (!cellDownDatabase) {
        console.error('Cell down database not initialized');
        throw new Error('Cell down database not initialized');
      }
      
      console.log('Loading cell down data from Realtime Database...');
      const dataRef = ref(cellDownDatabase, this.collectionName);
      const snapshot = await get(dataRef);
      
      if (!snapshot.exists()) {
        console.log('No cell down data found in Realtime Database');
        return [];
      }
      
      const allData: CellDownData[] = [];
      const data = snapshot.val();
      
      console.log(`Found ${Object.keys(data).length} cell down records`);
      
      // Convert object to array with sequential keys
      Object.keys(data).forEach((key) => {
        const item = data[key];
        allData.push({ 
          id: key, 
          ...item,
          // Ensure createdAt is properly formatted
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
        } as CellDownData);
      });
      
      // Sort by createdAt descending (newest first)
      const sortedData = allData.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('Cell down data loaded successfully');
      return sortedData;
    } catch (error) {
      console.error('Error loading cell down data:', error);
      throw new Error('Failed to load data from database');
    }
  }

  /**
   * Apply filters to data array
   * @param data - Array of Cell Down data to filter
   * @param filters - Filter criteria
   * @param searchTerm - Search term for text search
   * @param searchField - Field to search in
   * @returns Filtered array of Cell Down data
   */
  applyFilters(
    data: CellDownData[], 
    filters: FilterData, 
    searchTerm: string, 
    searchField: string
  ): CellDownData[] {
    let filtered = [...data];

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

    return filtered;
  }

  /**
   * Update a single Cell Down record
   * @param id - Document ID to update
   * @param updateData - Data to update
   * @returns Promise<void>
   */
  async updateRecord(id: string, updateData: Partial<CellDownData>): Promise<void> {
    try {
      if (!cellDownDatabase) {
        throw new Error('Cell down database not initialized');
      }
      const dataRef = ref(cellDownDatabase, `${this.collectionName}/${id}`);
      const dataWithTimestamp = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      await update(dataRef, dataWithTimestamp);
    } catch (error) {
      console.error('Error updating data:', error);
      throw new Error('Failed to update record');
    }
  }

  /**
   * Delete a single Cell Down record
   * @param id - Document ID to delete
   * @returns Promise<void>
   */
  async deleteRecord(id: string): Promise<void> {
    try {
      if (!cellDownDatabase) {
        throw new Error('Cell down database not initialized');
      }
      const dataRef = ref(cellDownDatabase, `${this.collectionName}/${id}`);
      await remove(dataRef);
    } catch (error) {
      console.error('Error deleting data:', error);
      throw new Error('Failed to delete record');
    }
  }

  /**
   * Delete multiple Cell Down records in batch
   * @param ids - Array of document IDs to delete
   * @returns Promise<void>
   */
  async deleteRecordsBatch(ids: string[]): Promise<void> {
    try {
      if (!cellDownDatabase) {
        throw new Error('Cell down database not initialized');
      }
      const updates: { [key: string]: null } = {};
      
      ids.forEach(itemId => {
        updates[`${this.collectionName}/${itemId}`] = null;
      });
      
      const dataRef = ref(cellDownDatabase);
      await update(dataRef, updates);
    } catch (error) {
      console.error('Error deleting data:', error);
      throw new Error('Failed to delete records');
    }
  }

  /**
   * Add a new Cell Down record with sequential key
   * @param data - Cell Down data to add
   * @returns Promise<string> - Document ID of the new record
   */
  async addRecord(data: Omit<CellDownData, 'id'>): Promise<string> {
    try {
      if (!cellDownDatabase) {
        throw new Error('Cell down database not initialized');
      }
      const dataRef = ref(cellDownDatabase, this.collectionName);
      const newRecordRef = push(dataRef);
      
      const recordData = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(newRecordRef, recordData);
      return newRecordRef.key!;
    } catch (error) {
      console.error('Error adding data:', error);
      throw new Error('Failed to add record');
    }
  }

  /**
   * Get the next sequential ID for manual insertion
   * @returns Promise<number> - Next sequential ID
   */
  async getNextSequentialId(): Promise<number> {
    try {
      if (!cellDownDatabase) {
        throw new Error('Cell down database not initialized');
      }
      const dataRef = ref(cellDownDatabase, this.collectionName);
      const snapshot = await get(dataRef);
      
      if (!snapshot.exists()) {
        return 0;
      }
      
      const data = snapshot.val();
      const keys = Object.keys(data);
      const numericKeys = keys
        .map(key => parseInt(key))
        .filter(key => !isNaN(key))
        .sort((a, b) => a - b);
      
      return numericKeys.length > 0 ? Math.max(...numericKeys) + 1 : 0;
    } catch (error) {
      console.error('Error getting next sequential ID:', error);
      throw new Error('Failed to get next sequential ID');
    }
  }

  /**
   * Add a new Cell Down record with specific sequential key
   * @param data - Cell Down data to add
   * @param sequentialId - Specific sequential ID to use
   * @returns Promise<string> - Document ID of the new record
   */
  async addRecordWithSequentialId(data: Omit<CellDownData, 'id'>, sequentialId: number): Promise<string> {
    try {
      if (!cellDownDatabase) {
        throw new Error('Cell down database not initialized');
      }
      const dataRef = ref(cellDownDatabase, `${this.collectionName}/${sequentialId}`);
      
      const recordData = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(dataRef, recordData);
      return sequentialId.toString();
    } catch (error) {
      console.error('Error adding data with sequential ID:', error);
      throw new Error('Failed to add record with sequential ID');
    }
  }

  /**
   * Extract unique values from data for filter dropdowns
   * @param data - Array of Cell Down data
   * @returns Object containing arrays of unique values
   */
  extractUniqueValues(data: CellDownData[]) {
    const nops = Array.from(new Set(data.map(item => item.nop).filter(Boolean))).sort();
    const weeks = Array.from(new Set(data.map(item => item.week).filter(Boolean))).sort((a, b) => a - b);
    const rangeAgingDown = Array.from(new Set(data.map(item => item.rangeAgingDown).filter(Boolean))).sort();
    const tos = Array.from(new Set(data.map(item => item.to).filter(Boolean))).sort();

    return {
      nops,
      weeks,
      rangeAgingDown,
      tos
    };
  }

  /**
   * Convert data to CSV format for clipboard
   * @param data - Array of Cell Down data to convert
   * @returns CSV string
   */
  convertToCSV(data: CellDownData[]): string {
    const dataToCopy = data.map(item => ({
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

    return csvContent;
  }

  /**
   * Copy data to clipboard
   * @param data - Array of Cell Down data to copy
   * @returns Promise<void>
   */
  async copyToClipboard(data: CellDownData[]): Promise<void> {
    try {
      const csvContent = this.convertToCSV(data);
      await navigator.clipboard.writeText(csvContent);
    } catch (error) {
      console.error('Error copying data:', error);
      throw new Error('Failed to copy data to clipboard');
    }
  }
}
