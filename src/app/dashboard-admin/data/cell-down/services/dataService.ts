/**
 * Data Service for Cell Down Management
 * Handles all CRUD operations and data manipulation for Cell Down data
 */

import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '@/app/firebaseConfig';
import { CellDownData, FilterData } from '../types';

/**
 * Data Service Class
 * Contains all methods for managing Cell Down data
 */
export class DataService {
  private readonly collectionName = 'data_celldown';

  /**
   * Load all Cell Down data from Firestore
   * @returns Promise<CellDownData[]> - Array of all Cell Down records
   */
  async loadData(): Promise<CellDownData[]> {
    try {
      const q = query(collection(db, this.collectionName), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const allData: CellDownData[] = [];
      
      querySnapshot.forEach((doc) => {
        allData.push({ id: doc.id, ...doc.data() } as CellDownData);
      });
      
      return allData;
    } catch (error) {
      console.error('Error loading data:', error);
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
      const docRef = doc(db, this.collectionName, id);
      const dataWithTimestamp = {
        ...updateData,
        updatedAt: new Date()
      };
      
      await updateDoc(docRef, dataWithTimestamp);
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
      await deleteDoc(doc(db, this.collectionName, id));
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
      const batch = writeBatch(db);
      
      ids.forEach(itemId => {
        const docRef = doc(db, this.collectionName, itemId);
        batch.delete(docRef);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting data:', error);
      throw new Error('Failed to delete records');
    }
  }

  /**
   * Add a new Cell Down record
   * @param data - Cell Down data to add
   * @returns Promise<string> - Document ID of the new record
   */
  async addRecord(data: Omit<CellDownData, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding data:', error);
      throw new Error('Failed to add record');
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
