"use client";
import React, { useState, useEffect } from "react";
import { Box, Tabs, Tab, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress } from "@mui/material";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from '@/app/firebaseConfig';

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

export default function LogsPage() {
  const [tab, setTab] = useState(0);
  // User Aktif
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  // Data Logs
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

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

  return (
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
                  <TableCell>{u.lastLogin ? new Date(u.lastLogin).toLocaleString('id-ID') : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabPanel>
      <TabPanel value={tab} index={1}>
        {loadingLogs ? <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box> : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Waktu</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Aksi</TableCell>
                <TableCell>Row ID</TableCell>
                <TableCell>Data Sebelum</TableCell>
                <TableCell>Data Sesudah</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center">Belum ada log perubahan data.</TableCell></TableRow>
              ) : logs.map(l => (
                <TableRow key={l.id}>
                  <TableCell>{l.time ? new Date(l.time).toLocaleString('id-ID') : '-'}</TableCell>
                  <TableCell>{l.user}</TableCell>
                  <TableCell>{l.role}</TableCell>
                  <TableCell>{l.action}</TableCell>
                  <TableCell>{l.rowId}</TableCell>
                  <TableCell>
                    <pre style={{ fontSize: 11, margin: 0, maxWidth: 180, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(l.dataBefore, null, 1)}</pre>
                  </TableCell>
                  <TableCell>
                    <pre style={{ fontSize: 11, margin: 0, maxWidth: 180, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(l.dataAfter, null, 1)}</pre>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabPanel>
    </Paper>
  );
} 