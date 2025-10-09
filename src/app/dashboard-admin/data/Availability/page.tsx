'use client';
import React, { useEffect, useState, useCallback, memo, useRef } from 'react';
import { Typography, CircularProgress, Box, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, TablePagination, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import { database } from '@/app/firebaseConfig';
import { ref, onValue, update } from "firebase/database";
import { collection, addDoc } from "firebase/firestore";
import { db } from '@/app/firebaseConfig';
import { auth } from '@/app/firebaseConfig';

const ROOT_CAUSE_OPTIONS = [
  'Power - Regular',
  'Power - Sewadaya',
  'Power - SPS',
  'Transport',
  'Radio',
  'Others',
];
const PIC_DEPT_OPTIONS = [
  'ENOM',
  'Power',
  'Transport',
  'NOP', // Tambahan
  'NOS',
  'Radio',
  'IM',
  'Project',
  'Engineering',
];
const PROGRESS_OPTIONS = [
  { value: 'Identification', label: '1. Identification' },
  { value: 'Plan Action', label: '2. Plan Action' },
  { value: 'Assessment', label: '3. Assessment' },
  { value: 'Justification', label: '4. Justification / RAB / BOQ' },
  { value: 'Waiting Budget', label: '5. Waiting Budget' },
  { value: 'Waiting PO', label: '6. Waiting PO' },
  { value: 'Have Program', label: '7. Have Program' },
  { value: 'Execution', label: '8. Execution' },
  { value: 'Done', label: '9. Done' },
];
const columns = [
  { id: 'No', label: 'No', minWidth: 40, maxWidth: 50 },
  { id: 'Category', label: 'Category', minWidth: 80, maxWidth: 120 },
  { id: 'Site ID', label: 'Site ID', minWidth: 80, maxWidth: 100 },
  { id: 'Site Name', label: 'Site Name', minWidth: 100, maxWidth: 120 },
  { id: 'Site Class', label: 'Site Class', minWidth: 80, maxWidth: 100 },
  { id: 'NOP', label: 'NOP', minWidth: 100, maxWidth: 120 },
  { id: 'Source Power', label: 'Source Power', minWidth: 60, maxWidth: 120, editable: true, type: 'text' },
  { id: 'Root Cause', label: 'Root Cause', minWidth: 100, maxWidth: 120, editable: true, type: 'select' },
  { id: 'Detail Problem', label: 'Detail Problem', minWidth: 120, maxWidth: 150, editable: true, type: 'text' },
  { id: 'Plan Action', label: 'Plan Action', minWidth: 120, maxWidth: 150, editable: true, type: 'text' },
  { id: 'Need Support', label: 'Need Support', minWidth: 120, maxWidth: 150, editable: true, type: 'text' },
  { id: 'PIC Dept', label: 'PIC Dept', minWidth: 100, maxWidth: 120, editable: true, type: 'select' },
  { id: 'Progress', label: 'Progress', minWidth: 80, maxWidth: 150, editable: true, type: 'select' },
  { id: 'Status', label: 'Status', minWidth: 80, maxWidth: 100 },
  { id: 'Remark', label: 'Remark', minWidth: 120, maxWidth: 150, editable: true, type: 'text' },
  { id: 'Action', label: 'Action', minWidth: 90, maxWidth: 100, action: true },
];

// Helper untuk format datetime-local
function toDatetimeLocal(dateString: string | null) {
  if (!dateString) return '';
  const d = new Date(dateString || '');
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 16);
}
// Helper untuk format tampilan tanggal (hanya tanggal saja)
function toDisplayDate(dateString: string | null) {
  if (!dateString) return '';
  const d = new Date(dateString || '');
  if (isNaN(d.getTime())) return '';
  // Format hanya tanggal (tanpa waktu)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const isSameDay = (dateA: string | null, dateB: string | null) => {
  const a = new Date(dateA || '');
  const b = new Date(dateB || '');
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

// Helper untuk deteksi guest
function isGuest() {
  // Jangan gunakan localStorage di SSR, gunakan state di komponen utama
  return false;
}

// Helper untuk cek admin
function isAdmin() {
  // Jangan gunakan localStorage di SSR, gunakan state di komponen utama
  return false;
}

const DataPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [discussOpen, setDiscussOpen] = useState(false);
  const [discussRow, setDiscussRow] = useState<any>(null);
  const [discussInput, setDiscussInput] = useState('');
  const [discussSnackbarOpen, setDiscussSnackbarOpen] = useState(false);
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [editCommentValue, setEditCommentValue] = useState('');
  // Tambah state untuk dialog histori date close
  const [dateCloseLogOpen, setDateCloseLogOpen] = useState(false);
  const [dateCloseLogArr, setDateCloseLogArr] = useState<string[]>([]);
  // State untuk modal detail
  const [showDetail, setShowDetail] = useState<any | null>(null);
  const detailFields = [
    'Category', 'Site ID', 'Site Name', 'Site Class', 'NOP', 'Source Power', 'Root Cause', 'Detail Problem', 'Plan Action', 'Need Support', 'PIC Dept', 'Progress', 'Status', 'Remark'
  ];
  // Tambah state untuk popup detail pesan
  const [detailPopup, setDetailPopup] = useState<{title: string, value: string} | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editNoChange, setEditNoChange] = useState<string | null>(null);
  const [isAdminState, setIsAdminState] = useState(false);

  // Filter states
  const [filter, setFilter] = useState({
    category: '',
    siteId: '',
    siteName: '',
    siteClass: '',
    nop: '',
    sourcePower: '',
    status: '',
    dateStart: '',
    dateEnd: '',
    picDept: '', // Tambah filter PIC Dept
    progress: '', // Tambah filter Progress
    rootCause: '', // Tambah filter Root Cause
  });
  // Draft filter for input before submit
  const [filterDraft, setFilterDraft] = useState({
    category: '',
    siteId: '',
    siteName: '',
    siteClass: '',
    nop: '',
    sourcePower: '',
    status: '',
    dateStart: '',
    dateEnd: '',
    picDept: '',
    progress: '',
    rootCause: '',
  });
  // Search global
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);
  // Tambah state untuk snackbar copy/download
  const [copySnackbarOpen, setCopySnackbarOpen] = useState(false);
  const [downloadSnackbarOpen, setDownloadSnackbarOpen] = useState(false);

  // Debounce untuk SEMUA filter dan search
  useEffect(() => {
    setFilterLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilter(filterDraft);
      setSearch(searchDraft);
      setPage(0);
      setFilterLoading(false);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filterDraft, searchDraft]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      setIsAdminState(['admin', 'user_admin', 'super_admin'].includes(role || ''));
    }
  }, []);

  // Unique values for dropdowns
  const uniqueOptions = (key: string) => {
    const opts = Array.from(new Set(rows.map(r => r[key]).filter(Boolean)));
    return opts.sort();
  };
  const statusOptions = ['Open', 'Waiting approval', 'Close', 'Rejected'];

  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }
    const dbRef = ref(database, 'availability'); // Ambil data dari availability
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Ubah objek menjadi array
        const arr = Object.entries(data).map(([id, value]: any) => ({
          id,
          ...value,
        }));
        setRows(arr);
      } else {
        setRows([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEditOpen = useCallback((row: any) => {
    setEditRow(row);
    setEditForm({
      'Root Cause': row['Root Cause'] || '',
      'PIC Dept': row['PIC Dept'] || '',
      'Source Power': row['Source Power'] || '',
      'Progress': row['Progress'] || '',
      'Detail Problem': row['Detail Problem'] || '',
      'Plan Action': row['Plan Action'] || '',
      'Need Support': row['Need Support'] || '',
      // Date Close: array of ISO string, fallback to []
      'Date Close': Array.isArray(row['Date Close']) ? row['Date Close'] : (row['Date Close'] ? [row['Date Close']] : []),
      '_prevProgress': row['Progress'] || '', // simpan progress sebelumnya
    });
    setEditOpen(true);
  }, []);

  const handleEditChange = (field: string, valueOrEvent: any) => {
    let value = valueOrEvent;
    // Untuk <select> native, ambil value dari event.target.value
    if (valueOrEvent && valueOrEvent.target && typeof valueOrEvent.target.value !== 'undefined') {
      value = valueOrEvent.target.value;
    }
    setEditForm((prev: any) => {
      if (field === 'Progress') {
        const isToDone = String(value).toLowerCase() === 'done';
        const wasDone = String(prev['Progress']).toLowerCase() === 'done';
        let dateCloseArr = Array.isArray(prev['Date Close']) ? [...prev['Date Close']] : [];
        if (isToDone && !wasDone) {
          const now = new Date().toISOString();
          // Cek apakah sudah ada log di hari yang sama
          const alreadyToday = dateCloseArr.some(d => isSameDay(d, now));
          if (!alreadyToday) {
            dateCloseArr.push(now);
          }
        }
        // Jika progress menjadi Done, otomatis set PIC Dept menjadi Radio
        const updatedForm = { ...prev, [field]: value, 'Date Close': dateCloseArr, '_prevProgress': prev['Progress'] };
        if (isToDone) {
          updatedForm['PIC Dept'] = 'Radio';
        }
        return updatedForm;
      }
      return { ...prev, [field]: value };
    });
  };

  const handleEditSave = async () => {
    if (!editRow) return;
    // Validasi: semua field wajib diisi
    const requiredFields = ['Root Cause', 'PIC Dept', 'Source Power', 'Progress', 'Detail Problem', 'Plan Action', 'Need Support'];
    for (const field of requiredFields) {
      if (!editForm[field] || String(editForm[field]).trim() === '') {
        setEditError(`Field '${field}' wajib diisi.`);
        return;
      }
    }
    // Cek perubahan data
    let isChanged = false;
    for (const field of requiredFields) {
      if ((editRow[field] || '') !== (editForm[field] || '')) {
        isChanged = true;
        break;
      }
    }
    if (!isChanged) {
      setEditNoChange('Tidak ada perubahan data.');
      return;
    }
    setEditError(null);
    setEditNoChange(null);
    const isDone = String(editForm['Progress']).toLowerCase() === 'done';
    const updates: any = {
      'Root Cause': editForm['Root Cause'],
      'PIC Dept': editForm['PIC Dept'],
      'Source Power': editForm['Source Power'],
      'Progress': editForm['Progress'],
      'Detail Problem': editForm['Detail Problem'],
      'Plan Action': editForm['Plan Action'],
      'Need Support': editForm['Need Support'],
      'Date Close': Array.isArray(editForm['Date Close']) ? editForm['Date Close'] : [],
      'Status': isDone ? 'Waiting approval' : '',
      'Remark': '',
    };
    if (!database) {
      setEditError('Database not initialized');
      return;
    }
    await update(ref(database, editRow.id), updates);
    // Logging ke Firestore data_logs
    try {
      const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : '';
      let email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : '';
      if (!email && typeof window !== 'undefined' && auth && auth.currentUser) {
        email = auth.currentUser.email || '';
      }
      await addDoc(collection(db, 'data_logs'), {
        action: 'update',
        email: email || '-',
        role: userRole || '-',
        time: new Date().toISOString(),
        dataBefore: editRow,
        dataAfter: updates,
        rowId: editRow.id,
      });
    } catch (e) {
      // Optional: bisa tambahkan error handling/logging
    }
    setEditOpen(false);
    setEditRow(null);
    setEditForm({});
    setSnackbarOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditRow(null);
    setEditForm({});
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleDiscussOpen = useCallback((row: any) => {
    setDiscussRow(row);
    setDiscussOpen(true);
    setEditCommentId(null);
    setEditCommentValue('');
  }, []);
  const handleDiscussClose = () => {
    setDiscussOpen(false);
    setDiscussRow(null);
    setDiscussInput('');
    setEditCommentId(null);
    setEditCommentValue('');
  };
  const handleAddComment = async () => {
    if (!discussRow || !discussInput.trim() || !auth || !auth.currentUser) return;
    const newComment = {
      text: discussInput,
      time: new Date().toISOString(),
      authorId: auth.currentUser.uid,
      authorName: auth.currentUser.displayName || auth.currentUser.email || 'User',
      authorEmail: auth.currentUser.email || '',
      authorPhotoURL: auth.currentUser.photoURL || '',
      id: Math.random().toString(36).slice(2),
    };
    if (!database) {
      console.error('Database not initialized');
      return;
    }
    const oldDiscuss = Array.isArray(discussRow.Discuss) ? discussRow.Discuss : [];
    const updates = { Discuss: [...oldDiscuss, newComment] };
    await update(ref(database, discussRow.id), updates);
    setDiscussInput('');
    setDiscussSnackbarOpen(true);
    // Refresh discussRow dari database agar komentar langsung tampil
    const dbRef = ref(database, discussRow.id);
    onValue(dbRef, (snapshot) => {
      setDiscussRow({ id: discussRow.id, ...snapshot.val() });
    }, { onlyOnce: true });
  };
  const handleDeleteComment = async (commentId: string) => {
    if (!discussRow || !database) return;
    const oldDiscuss = Array.isArray(discussRow.Discuss) ? discussRow.Discuss : [];
    const newDiscuss = oldDiscuss.filter((c: any) => c.id !== commentId);
    await update(ref(database, discussRow.id), { Discuss: newDiscuss });
    // Refresh discussRow dari database agar tampilan langsung update
    const dbRef = ref(database, discussRow.id);
    onValue(dbRef, (snapshot) => {
      setDiscussRow({ id: discussRow.id, ...snapshot.val() });
    }, { onlyOnce: true });
  };
  const handleEditComment = (commentId: string, value: string) => {
    setEditCommentId(commentId);
    setEditCommentValue(value);
  };
  const handleSaveEditComment = async () => {
    if (!discussRow || !editCommentId || !database) return;
    const oldDiscuss = Array.isArray(discussRow.Discuss) ? discussRow.Discuss : [];
    const newDiscuss = oldDiscuss.map((c: any) => c.id === editCommentId ? { ...c, text: editCommentValue } : c);
    await update(ref(database, discussRow.id), { Discuss: newDiscuss });
    // Refresh discussRow dari database agar tampilan langsung update
    const dbRef = ref(database, discussRow.id);
    onValue(dbRef, (snapshot) => {
      setDiscussRow({ id: discussRow.id, ...snapshot.val() });
    }, { onlyOnce: true });
    setEditCommentId(null);
    setEditCommentValue('');
  };
  const handleDiscussSnackbarClose = () => setDiscussSnackbarOpen(false);

  // Pada DataPage, tambahkan handler untuk show log
  const handleShowDateCloseLog = (arr: string[]) => {
    setDateCloseLogArr(arr);
    setDateCloseLogOpen(true);
  };

  // Filtered rows dengan search global
  const filteredRows = rows.filter(row => {
    // Search global: cek semua kolom utama
    const searchVal = search.trim().toLowerCase();
    const matchSearch = !searchVal || [
      row['Category'], row['Site ID'], row['Site Name'], row['Site Class'], row['NOP'], row['Source Power'], row['Root Cause'], row['Detail Problem'], row['Plan Action'], row['Need Support'], row['PIC Dept'], row['Progress'], row['Status'], row['Remark']
    ].some(val => (val || '').toString().toLowerCase().includes(searchVal));
    if (!matchSearch) return false;
    // Filter lain
    const match = (val: string, filterVal: string) => !filterVal || (val || '').toLowerCase().includes(filterVal.toLowerCase());
    const matchDate = (dateArr: any) => {
      if (!filter.dateStart && !filter.dateEnd) return true;
      const arr = Array.isArray(dateArr) ? dateArr : (dateArr ? [dateArr] : []);
      if (arr.length === 0) return false;
      // Cek jika ada salah satu tanggal dalam rentang
      return arr.some((d: string) => {
        const t = new Date(d).getTime();
        const start = filter.dateStart ? new Date(filter.dateStart).getTime() : -Infinity;
        const end = filter.dateEnd ? new Date(filter.dateEnd).getTime() : Infinity;
        return t >= start && t <= end;
      });
    };
    // Filter Root Cause
    const matchRootCause = () => {
      if (!filter.rootCause) return true;
      if (filter.rootCause === 'blank') {
        return !row['Root Cause'] || String(row['Root Cause']).trim() === '';
      }
      return (row['Root Cause'] || '').toLowerCase() === filter.rootCause.toLowerCase();
    };
    return (
      match(row['Category'], filter.category) &&
      match(row['Site ID'], filter.siteId) &&
      match(row['Site Name'], filter.siteName) &&
      match(row['Site Class'], filter.siteClass) &&
      match(row['NOP'], filter.nop) &&
      match(row['Source Power'], filter.sourcePower) &&
      (!filter.status || (row['Status'] || '').toLowerCase() === filter.status.toLowerCase()) &&
      matchDate(row['Date Close']) &&
      (!filter.picDept || (row['PIC Dept'] || '').toLowerCase() === filter.picDept.toLowerCase()) &&
      (!filter.progress || (row['Progress'] || '').toLowerCase() === filter.progress.toLowerCase()) &&
      matchRootCause()
    );
  });

  const getDeptPicTableData = () => {
    // Gunakan urutan dari PIC_DEPT_OPTIONS terbaru
    return PIC_DEPT_OPTIONS.map(g => {
      const groupRows = rows.filter(r => r['PIC Dept'] === g);
      return {
        label: g,
        open: groupRows.filter(r => (r['Status'] || 'Open') === 'Open').length,
        waiting: groupRows.filter(r => r['Status'] === 'Waiting approval').length,
        rejected: groupRows.filter(r => r['Status'] === 'Rejected').length,
        close: groupRows.filter(r => r['Status'] === 'Close').length,
      };
    }).concat({
      label: 'Grand Total',
      open: rows.filter(r => (r['Status'] || 'Open') === 'Open').length,
      waiting: rows.filter(r => r['Status'] === 'Waiting approval').length,
      rejected: rows.filter(r => r['Status'] === 'Rejected').length,
      close: rows.filter(r => r['Status'] === 'Close').length,
    });
  };

  return (
    <Box p={{ xs: 1, md: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={3} sx={{ letterSpacing: 0.2 }}>
        Data Availability
      </Typography>
      {/* Search & Filter Bar */}
      <Paper sx={{ mb: 2, p: { xs: 1, md: 2 }, borderRadius: 3, boxShadow: '0 1px 8px rgba(30,58,138,0.06)' }}>
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} gap={2}>
          <TextField
            size="small"
            placeholder="Cari data... (semua kolom)"
            value={searchDraft}
            onChange={e => setSearchDraft(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 220, maxWidth: 320, background: '#fff', borderRadius: 2 }}
          />
          {/* Filter Bar */}
          <Box display="flex" flexWrap="wrap" gap={1} alignItems="center" flex={1}>
            <TextField
              select size="small" label="Category" value={filterDraft.category} onChange={e => setFilterDraft(f => ({ ...f, category: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 110 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {uniqueOptions('Category').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </TextField>
              <TextField select size="small" label="Site ID" value={filterDraft.siteId} onChange={e => setFilterDraft(f => ({ ...f, siteId: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 90 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {uniqueOptions('Site ID').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </TextField>
              <TextField select size="small" label="Site Name" value={filterDraft.siteName} onChange={e => setFilterDraft(f => ({ ...f, siteName: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 120 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {uniqueOptions('Site Name').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </TextField>
              <TextField select size="small" label="Site Class" value={filterDraft.siteClass} onChange={e => setFilterDraft(f => ({ ...f, siteClass: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 90 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {uniqueOptions('Site Class').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </TextField>
              <TextField select size="small" label="NOP" value={filterDraft.nop} onChange={e => setFilterDraft(f => ({ ...f, nop: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 110 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {uniqueOptions('NOP').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </TextField>
              <TextField select size="small" label="Source Power" value={filterDraft.sourcePower} onChange={e => setFilterDraft(f => ({ ...f, sourcePower: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 110 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {uniqueOptions('Source Power').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </TextField>
              <TextField select size="small" label="Status" value={filterDraft.status} onChange={e => setFilterDraft(f => ({ ...f, status: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 90 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </TextField>
            {/* Date Close filter dalam satu baris */}
            <Box display="flex" alignItems="center" gap={1}>
              <TextField size="small" label="Date Close" type="date" value={filterDraft.dateStart} onChange={e => setFilterDraft(f => ({ ...f, dateStart: e.target.value }))} sx={{ minWidth: 130 }} InputLabelProps={{ shrink: true }} />
              <Typography variant="body2" color="text.secondary">to</Typography>
              <TextField size="small" label="" type="date" value={filterDraft.dateEnd} onChange={e => setFilterDraft(f => ({ ...f, dateEnd: e.target.value }))} sx={{ minWidth: 130 }} InputLabelProps={{ shrink: true }} />
            </Box>
              <TextField select size="small" label="PIC Dept" value={filterDraft.picDept} onChange={e => setFilterDraft(f => ({ ...f, picDept: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 90 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {PIC_DEPT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </TextField>
              <TextField select size="small" label="Progress" value={filterDraft.progress} onChange={e => setFilterDraft(f => ({ ...f, progress: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 120 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {PROGRESS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </TextField>
              <TextField select size="small" label="Root Cause" value={filterDraft.rootCause || ''} onChange={e => setFilterDraft(f => ({ ...f, rootCause: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 120 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                <option value="blank">Blank</option>
                {ROOT_CAUSE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </TextField>
            <Button variant="outlined" size="small" color="inherit" sx={{ ml: 1, minWidth: 80, fontWeight: 600, borderRadius: 2 }} onClick={() => { setFilterDraft({ category: '', siteId: '', siteName: '', siteClass: '', nop: '', sourcePower: '', status: '', dateStart: '', dateEnd: '', picDept: '', progress: '', rootCause: '' }); setSearchDraft(''); setPage(0); }}>Reset</Button>
            {filterLoading && <CircularProgress size={18} sx={{ ml: 1 }} />}
          </Box>
        </Box>
      </Paper>
      {/* Tombol Export/Copy untuk admin/super_admin */}
      {isAdminState && (
        <Box display="flex" gap={1} mb={2} mt={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={() => {
              // Copy to clipboard
              const header = columns.map(col => col.label).join('\t');
              const rowsData = filteredRows.map(row => columns.map(col => (row[col.id] ?? '').toString().replace(/\n/g, ' ')).join('\t')).join('\n');
              const text = header + '\n' + rowsData;
              navigator.clipboard.writeText(text);
              setCopySnackbarOpen(true);
            }}
          >
            Copy
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => {
              // Download as CSV
              const header = columns.map(col => '"' + col.label.replace(/"/g, '""') + '"').join(',');
              const rowsData = filteredRows.map(row => columns.map(col => '"' + (row[col.id] ?? '').toString().replace(/"/g, '""').replace(/\n/g, ' ') + '"').join(',')).join('\n');
              const csv = header + '\n' + rowsData;
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'data_availability.csv';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              setDownloadSnackbarOpen(true);
            }}
          >
            Download CSV
          </Button>
        </Box>
      )}
      {/* Table Data */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 8px rgba(30,58,138,0.06)', maxHeight: 520 }}>
        <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow sx={{ background: '#f7fafd' }}>
              {columns.filter(col => col.id !== 'Status' && col.id !== 'Remark' && col.id !== 'Action').map(col => (
                <TableCell key={col.id} sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>{col.label}</TableCell>
              ))}
              <TableCell key="Status" sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, textAlign: 'center' }}>Status</TableCell>
              <TableCell key="Remark" sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Remark</TableCell>
              <TableCell key="Action" sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, textAlign: 'center' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  Tidak ada data.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                <RowItem
                  key={row.id}
                  row={row}
                  columns={columns}
                  onEditOpen={isGuest() ? undefined : handleEditOpen}
                  onDiscussOpen={isGuest() ? undefined : handleDiscussOpen}
                  onShowDateCloseLog={handleShowDateCloseLog}
                  rowNumber={page * rowsPerPage + idx + 1}
                  nativeTable={true}
                  onRowClick={(e: any) => {
                    if (["BUTTON", "SVG", "PATH"].indexOf((e.target as HTMLElement).tagName) === -1) setShowDetail(row);
                  }}
                  setDetailPopup={setDetailPopup}
                  isGuest={isGuest()}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Pagination */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" mt={1}>
        <TablePagination
          component="div"
          count={filteredRows.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Show"
          sx={{ '.MuiTablePagination-toolbar': { minHeight: 40 }, '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: 13 } }}
        />
      </Box>
      {/* Edit Dialog */}
      {!isGuest() && (
        <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Data</DialogTitle>
          {editRow && (
            <Box px={3} pb={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Site ID: {editRow['Site ID']}
              </Typography>
            </Box>
          )}
          <DialogContent dividers>
            <Box display="flex" flexDirection="column" gap={2}>
              {editError && (
                <Typography color="error" fontSize={14}>{editError}</Typography>
              )}
              {editNoChange && (
                <Typography color="warning.main" fontSize={14}>{editNoChange}</Typography>
              )}
              <label style={{ fontWeight: 500 }}>Root Cause
                <select
                  value={editForm['Root Cause'] || ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleEditChange('Root Cause', e)}
                  style={{ width: '100%', padding: 6, marginTop: 2, borderRadius: 4, border: '1px solid #ccc' }}
                >
                  <option value="">Pilih Root Cause</option>
                  {ROOT_CAUSE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
              <TextField
                label="Detail Problem"
                value={editForm['Detail Problem'] || ''}
                onChange={e => handleEditChange('Detail Problem', e.target.value)}
                fullWidth
                multiline
                minRows={2}
                placeholder="Tambah Detail Problem"
              />
              <TextField
                label="Plan Action"
                value={editForm['Plan Action'] || ''}
                onChange={e => handleEditChange('Plan Action', e.target.value)}
                fullWidth
                multiline
                minRows={2}
                placeholder="Tambah Plan Action"
              />
              <TextField
                label="Need Support"
                value={editForm['Need Support'] || ''}
                onChange={e => handleEditChange('Need Support', e.target.value)}
                fullWidth
                multiline
                minRows={2}
                placeholder="Tambah Need Support."
              />
              {/* TUKAR URUTAN: Progress lalu PIC Dept */}
              <label style={{ fontWeight: 500 }}>Progress
                <select
                  value={editForm['Progress'] || ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleEditChange('Progress', e)}
                  style={{ width: '100%', padding: 6, marginTop: 2, borderRadius: 4, border: '1px solid #ccc' }}
                >
                  <option value="">Pilih Progress</option>
                  {PROGRESS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <label style={{ fontWeight: 500 }}>PIC Dept
                <select
                  value={editForm['PIC Dept'] || ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleEditChange('PIC Dept', e)}
                  style={{ width: '100%', padding: 6, marginTop: 2, borderRadius: 4, border: '1px solid #ccc' }}
                >
                  <option value="">Pilih PIC Dept</option>
                  {PIC_DEPT_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditClose}>Cancel</Button>
            <Button onClick={handleEditSave} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>
      )}
      {/* Discuss Dialog */}
      {!isGuest() && (
        <Dialog open={discussOpen} onClose={handleDiscussClose} maxWidth="sm" fullWidth>
          <DialogTitle>Diskusi/Log Komentar</DialogTitle>
          <DialogContent dividers>
            <Box display="flex" flexDirection="column" gap={2}>
              {(Array.isArray(discussRow?.Discuss) && discussRow.Discuss.length > 0) ? discussRow.Discuss.map((c: any) => {
                const [formattedTime, setFormattedTime] = useState('');
                useEffect(() => { setFormattedTime(new Date(c.time).toLocaleString('id-ID')); }, [c.time]);
                return (
                <Box key={c.id} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 1, mb: 1, bgcolor: '#fafbfc' }}>
                  {editCommentId === c.id ? (
                    <Box display="flex" gap={1} alignItems="center" mt={1}>
                      <TextField
                        value={editCommentValue}
                        onChange={e => setEditCommentValue(e.target.value)}
                        size="small"
                        fullWidth
                        multiline
                        minRows={2}
                      />
                      <Button onClick={handleSaveEditComment} size="small" variant="contained">Simpan</Button>
                      <Button onClick={() => setEditCommentId(null)} size="small">Batal</Button>
                    </Box>
                  ) : (
                    <Box display="flex" flexDirection="row" alignItems="flex-start" gap={2} mt={1}>
                      {/* Avatar */}
                      <Box display="flex" flexDirection="column" alignItems="center" mt={0.5}>
                        {c.authorPhotoURL ? (
                          <img src={c.authorPhotoURL} alt={c.authorName} style={{ width: 36, height: 36, borderRadius: '50%' }} />
                        ) : (
                          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#bdbdbd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 18 }}>
                            {c.authorName ? c.authorName.charAt(0).toUpperCase() : 'U'}
                          </Box>
                        )}
                      </Box>
                      {/* Konten */}
                      <Box flex={1} display="flex" flexDirection="column" gap={0.5}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1 }}>{c.authorName}</Typography>
                            {c.authorEmail && (
                              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>{c.authorEmail}</Typography>
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>{formattedTime}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>{c.text}</Typography>
                        {auth.currentUser && c.authorId === auth.currentUser.uid && (
                          <Box display="flex" gap={1} justifyContent="flex-end" mt={1}>
                            <Button size="small" startIcon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.79l-4 1 1-4 12.362-12.303z" /></svg>} onClick={() => handleEditComment(c.id, c.text)}>Edit</Button>
                            <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteComment(c.id)}>Hapus</Button>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              );
              }) : (
                <Typography variant="body2" color="text.secondary">Belum ada komentar.</Typography>
              )}
              <TextField
                label="Tambah Komentar"
                value={discussInput}
                onChange={e => setDiscussInput(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                placeholder="Tulis komentar..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDiscussClose}>Tutup</Button>
            <Button onClick={handleAddComment} variant="contained">Tambah</Button>
          </DialogActions>
        </Dialog>
      )}
      {/* Snackbar Success */}
      {!isGuest() && (
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          message="Data berhasil diupdate"
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        />
      )}
      {/* Snackbar Success Komentar */}
      {!isGuest() && (
        <Snackbar
          open={discussSnackbarOpen}
          autoHideDuration={3000}
          onClose={handleDiscussSnackbarClose}
          message="Komentar berhasil ditambahkan"
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        />
      )}
      {/* Snackbar Success Copy/Download */}
      <Snackbar
        open={copySnackbarOpen}
        autoHideDuration={2000}
        onClose={() => setCopySnackbarOpen(false)}
        message="Data berhasil dicopy ke clipboard!"
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
      <Snackbar
        open={downloadSnackbarOpen}
        autoHideDuration={2000}
        onClose={() => setDownloadSnackbarOpen(false)}
        message="File CSV berhasil diunduh!"
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
      {/* Dialog histori Date Close */}
      <Dialog open={dateCloseLogOpen} onClose={() => setDateCloseLogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Histori Date Close</DialogTitle>
        <DialogContent dividers>
          {dateCloseLogArr && dateCloseLogArr.length > 0 ? (
            <Box display="flex" flexDirection="column" gap={1}>
              {dateCloseLogArr.map((d, idx) => (
                <Box key={idx} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 1, bgcolor: '#fafbfc', fontSize: 14 }}>
                  {toDisplayDate(d)}
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">Belum ada histori.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDateCloseLogOpen(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>
      {/* Modal detail */}
      {showDetail && (
        <div style={{ position: 'fixed', zIndex: 1000, left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDetail(null)}>
          <div style={{ background: '#fff', borderRadius: 8, minWidth: 320, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Detail Data</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {detailFields.map(field => (
                  <tr key={field}>
                    <th style={{ width: 140, border: '1px solid #e0e0e0', padding: 8, textAlign: 'left' }}>{field}</th>
                    <td style={{ border: '1px solid #e0e0e0', padding: 8 }}>{Array.isArray(showDetail[field]) ? showDetail[field].join(', ') : (showDetail[field] ?? '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', marginTop: 18 }}>
              <button onClick={() => setShowDetail(null)} style={{ padding: '6px 18px', borderRadius: 4, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
      {detailPopup && (
        <Dialog open={!!detailPopup} onClose={() => setDetailPopup(null)} maxWidth="sm" fullWidth>
          <DialogTitle>{detailPopup.title}</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" style={{whiteSpace:'pre-line'}}>{detailPopup.value}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailPopup(null)}>Tutup</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

const RowItem = memo(function RowItem({ row, columns, onEditOpen, onDiscussOpen, onShowDateCloseLog, rowNumber, nativeTable, onRowClick, setDetailPopup, isGuest }: any) {
  if (!nativeTable) return null;
  // Helper untuk field panjang
  const renderCell = (col: any) => {
    const val = row[col.id];
    if (["Detail Problem", "Plan Action", "Need Support", "Remark"].includes(col.id)) {
      if (!val) return <span></span>;
      const str = String(val);
      if (str.length > 3) {
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ flex: 1 }}>{str.slice(0, 3)}...</span>
            <button 
              style={{
                color: '#1976d2',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                fontSize: 11,
                fontWeight: 500,
                transition: 'all 0.2s',
                minWidth: 'auto'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = '#e3f2fd';
                e.currentTarget.style.color = '#1565c0';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#1976d2';
              }}
              onClick={e => {
                e.stopPropagation(); 
                setDetailPopup({title: col.label, value: str});
              }}
              title={`Lihat detail ${col.label}`}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Detail
            </button>
          </span>
        );
      }
      return <span>{str}</span>;
    }
    if (col.id === 'Date Close' && val) {
      const arr = Array.isArray(val) ? val : [val];
      const last = arr.length > 0 ? arr[arr.length - 1] : '';
      return last ? toDisplayDate(last) : '';
    }
    return val;
  };
  return (
    <TableRow hover sx={{ '&:hover': { bgcolor: '#f5f5f5' } }} onClick={onRowClick}>
      {/* Kolom nomor */}
      <TableCell key="No" align="center" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{rowNumber}</TableCell>
      {columns.filter((col: any) => col.id !== 'No' && col.id !== 'Status' && col.id !== 'Remark' && col.id !== 'Action').map((col: any) => (
        <TableCell key={col.id} align="left" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{renderCell(col)}</TableCell>
      ))}
      {/* Status */}
      <TableCell key="Status" align="center" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>
        {row['Status'] === 'Waiting approval' ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {/* Ikon jam modern (Material UI SVG) */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontWeight: 600, color: '#ff9800', letterSpacing: 0.2 }}>Waiting approval</span>
          </span>
        ) : row['Status'] === 'Close' ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="18" height="18" fill="none" stroke="green" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
            <span style={{ fontWeight: 600, color: 'green', letterSpacing: 0.2 }}>Close</span>
          </span>
        ) : row['Status'] === 'Rejected' ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="18" height="18" fill="none" stroke="red" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
            <span style={{ fontWeight: 600, color: 'red', letterSpacing: 0.2 }}>Rejected</span>
          </span>
        ) : !row['Status'] ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="18" height="18" fill="none" stroke="#1976d2" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /></svg>
            <span style={{ fontWeight: 600, color: '#1976d2', letterSpacing: 0.2 }}>Open</span>
          </span>
        ) : (
          row['Status'] || ''
        )}
      </TableCell>
      {/* Remark */}
      <TableCell key="Remark" align="left" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{renderCell({id:'Remark',label:'Remark'})}</TableCell>
      {/* Action */}
      <TableCell key="Action" align="center" sx={{ border: '1px solid #e0e0e0', padding: '0 2px', fontSize: 13, verticalAlign: 'middle', cursor: 'default' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {onEditOpen && (
            <IconButton
              onClick={() => onEditOpen(row)}
              sx={{ color: '#1976d2' }}
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.79l-4 1 1-4 12.362-12.303z" />
              </svg>
            </IconButton>
          )}
          {onShowDateCloseLog && (
            <IconButton
              onClick={() => {
                const arr = Array.isArray(row['Date Close']) ? row['Date Close'] : [row['Date Close']];
                onShowDateCloseLog(arr);
              }}
              sx={{ color: '#43a047' }}
              title="Detail Date Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-3A2.25 2.25 0 0 0 8.25 5.25V9m7.5 0v10.5A2.25 2.25 0 0 1 13.5 21h-3a2.25 2.25 0 0 1-2.25-2.25V9m7.5 0h-7.5" />
              </svg>
            </IconButton>
          )}
          {onDiscussOpen && (
            <IconButton
              onClick={() => onDiscussOpen(row)}
              sx={{ color: '#1976d2' }}
              title="Diskusi"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75v-13.5A2.25 2.25 0 0 1 4.5 3h15a2.25 2.25 0 0 1 2.25 2.25v13.5a2.25 2.25 0 0 1-2.25 2.25H6.75L2.25 21.75V18.75z" />
              </svg>
            </IconButton>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

export default DataPage; 