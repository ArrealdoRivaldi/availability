export interface CellDownData {
  id: string;
  week?: string | number;
  progress?: string;
  status?: string;
  rootCause?: string;
  picDept?: string;
  siteClass?: string;
  nop?: string;
  agingDown?: number;
  createdAt?: any;
}

export const mapFirestoreData = (docData: any, docId: string): CellDownData => {
  return {
    id: docId,
    week: docData.week || '',
    progress: docData.progress || docData.progress_status || '',
    status: docData.status || docData.status_alarm || docData.alarm_status || '',
    rootCause: docData.rootCause || docData.root_cause || docData.rootCause || '',
    picDept: docData.picDept || docData.pic_dept || docData.picDepartment || docData.pic || '',
    siteClass: docData.siteClass || docData.site_class || docData.siteClassification || '',
    nop: docData.nop || docData.nop_location || docData.location || docData.region || '',
    agingDown: docData.agingDown || docData.aging_down || docData.aging || 0,
    createdAt: docData.createdAt || docData.created_at || docData.timestamp || null
  };
};

export const getWeekNumber = (date: Date): string => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `W${weekNumber}`;
};

export const extractWeekFromTimestamp = (timestamp: any): string => {
  if (!timestamp) return '';
  
  try {
    let date: Date;
    if (timestamp.toDate) {
      // Firestore Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      // Date object
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      // String date
      date = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      // Unix timestamp
      date = new Date(timestamp);
    } else {
      return '';
    }
    
    return getWeekNumber(date);
  } catch (error) {
    console.error('Error extracting week from timestamp:', error);
    return '';
  }
};
