"use client";
import React, { useState, useEffect } from "react";
import { Box, Tabs, Tab, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, TableContainer, TablePagination } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, getDocs, query, orderBy, deleteDoc, doc, limit, startAfter } from "firebase/firestore";
import { db } from '@/app/firebaseConfig';
import { SuperAdminGuard } from '@/components/SuperAdminGuard';

function TabPanel(props: any) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>{children}</Box>
      )}
    </div>
  );
}

// Tambahkan komponen helper untuk format tanggal di client
function ClientDate({ date }: { date: string }) {
  const [formatted, setFormatted] = React.useState('');
  React.useEffect(() => {
    if (date) setFormatted(new Date(date).toLocaleString('id-ID'));
  }, [date]);
  return <>{formatted || '-'}</>;
}

export default function LogsPage() {
  const [tab, setTab] = useState(0);
  // User Aktif
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  // Data Logs
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, id: string|null}>({open: false, id: null});

  useEffect(() => {
    // Ambil user aktif
    setLoadingUsers(true);
    getDocs(collection(db, 'active_users')).then(snap => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingUsers(false);
    });
    // Ambil data logs (urutkan terbaru dulu)
    setLoadingLogs(true);
    getDocs(query(collection(db, 'data_logs'), orderBy('time', 'desc'))).then(snap => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingLogs(false);
    });
  }, []);

  // Delete log
  const handleDeleteLog = async (id: string|null) => {
    if (!id) return;
    await deleteDoc(doc(db, 'data_logs', id));
    setLogs(logs => logs.filter(l => l.id !== id));
    setDeleteDialog({open: false, id: null});
  };

  return (
    <SuperAdminGuard>
      <Paper sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Logs Monitoring</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="User Aktif" />
        <Tab label="Data Logs" />
      </Tabs>
      <TabPanel value={tab} index={0}>
        {loadingUsers ? <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box> : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Display Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Last Login</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center">Tidak ada user aktif.</TableCell></TableRow>
              ) : users.map(u => (
                <TableRow key={u.id}>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.displayName}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell><ClientDate date={u.lastLogin} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <Box mb={1} display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">Total Log: {logs.length}</Typography>
        </Box>
        {loadingLogs ? <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box> : (
          <TableContainer sx={{ maxHeight: 500, borderRadius: 2 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Waktu</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Aksi</TableCell>
                  <TableCell>Row ID</TableCell>
                  <TableCell>Data Sebelum</TableCell>
                  <TableCell>Data Sesudah</TableCell>
                  <TableCell align="center">Delete</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center">Belum ada log perubahan data.</TableCell></TableRow>
                ) : logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(l => (
                  <TableRow key={l.id}>
                    <TableCell><ClientDate date={l.time} /></TableCell>
                    <TableCell>{(l.user && l.user !== '-') ? l.user : (l.email || '-')}</TableCell>
                    <TableCell>{l.role}</TableCell>
                    <TableCell>{l.action}</TableCell>
                    <TableCell>{l.rowId}</TableCell>
                    <TableCell>
                      <pre style={{ fontSize: 11, margin: 0, maxWidth: 180, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(l.dataBefore, null, 1)}</pre>
                    </TableCell>
                    <TableCell>
                      <pre style={{ fontSize: 11, margin: 0, maxWidth: 180, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(l.dataAfter, null, 1)}</pre>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton color="error" onClick={() => setDeleteDialog({open: true, id: l.id})} size="small">
                        <DeleteIcon />
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
          count={logs.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="Show"
          sx={{ '.MuiTablePagination-toolbar': { minHeight: 40 }, '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: 13 } }}
        />
        {/* Delete Dialog */}
        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({open: false, id: null})}>
          <DialogTitle>Hapus Log</DialogTitle>
          <DialogContent>Yakin ingin menghapus log ini? Tindakan ini tidak bisa dibatalkan.</DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({open: false, id: null})}>Batal</Button>
            <Button color="error" variant="contained" onClick={() => handleDeleteLog(deleteDialog.id)}>Hapus</Button>
          </DialogActions>
        </Dialog>
      </TabPanel>
    </Paper>
    </SuperAdminGuard>
  );
} 