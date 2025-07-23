"use client";
import { styled, Container, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import React, { useState } from "react";
import Header from "@/app/dashboard-admin/layout/header/Header";
import Sidebar from "@/app/dashboard-admin/layout/sidebar/Sidebar";
import { useRouter } from "next/navigation";
import { auth, db } from "@/app/firebaseConfig";
import { doc, deleteDoc } from "firebase/firestore";


const MainWrapper = styled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  width: "100%",
}));

const PageWrapper = styled("div")(() => ({
  display: "flex",
  flexGrow: 1,
  paddingBottom: "60px",
  flexDirection: "column",
  zIndex: 1,
  backgroundColor: "transparent",
}));

interface Props {
  children: React.ReactNode;
}

function IdleLogout() {
  const router = useRouter();
  const [showModal, setShowModal] = React.useState(false);
  const modalTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const idleTime = 15 * 60 * 1000; // 15 menit
  const warningTime = 1 * 60 * 1000; // 1 menit sebelum logout

  React.useEffect(() => {
    const cleanup = () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (modalTimeoutRef.current) clearTimeout(modalTimeoutRef.current);
    };
    const startIdleTimer = () => {
      cleanup();
      idleTimeoutRef.current = setTimeout(() => {
        setShowModal(true);
        // Timer untuk logout setelah 1 menit jika tetap idle
        modalTimeoutRef.current = setTimeout(async () => {
          setShowModal(false);
          // Hapus localStorage
          localStorage.removeItem('userRole');
          localStorage.removeItem('userEmail');
          // Hapus user dari active_users jika login
          const user = auth.currentUser;
          if (user) {
            try {
              await deleteDoc(doc(db, 'active_users', user.uid));
            } catch {}
          }
          // Logout firebase
          try { await auth.signOut(); } catch {}
          // Redirect ke login
          router.push('/');
        }, warningTime);
      }, idleTime - warningTime);
    };
    // Event yang dianggap aktivitas
    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      if (showModal) setShowModal(false);
      startIdleTimer();
    };
    events.forEach(ev => window.addEventListener(ev, handleActivity));
    startIdleTimer();
    return () => {
      cleanup();
      events.forEach(ev => window.removeEventListener(ev, handleActivity));
    };
  }, [router, showModal]);
  return (
    <>
      <Dialog open={showModal}>
        <DialogTitle>Anda akan logout otomatis</DialogTitle>
        <DialogContent>
          <p>Anda tidak melakukan aktivitas selama 14 menit.<br/>Anda akan logout otomatis dalam 1 menit.<br/>Klik di mana saja untuk tetap login.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)} variant="contained">Tetap Login</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  return (
    <MainWrapper className="mainwrapper">
      <IdleLogout />
      {/* ------------------------------------------- */}
      {/* Sidebar */}
      {/* ------------------------------------------- */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onSidebarClose={() => setMobileSidebarOpen(false)}
      />
      {/* ------------------------------------------- */}
      {/* Main Wrapper */}
      {/* ------------------------------------------- */}
      <PageWrapper className="page-wrapper">
        {/* ------------------------------------------- */}
        {/* Header */}
        {/* ------------------------------------------- */}
        <Header toggleMobileSidebar={() => setMobileSidebarOpen(true)} />
        {/* ------------------------------------------- */}
        {/* PageContent */}
        {/* ------------------------------------------- */}
        <Container
          sx={{
            paddingTop: "20px",
            maxWidth: "1200px",
          }}
        >
          {/* ------------------------------------------- */}
          {/* Page Route */}
          {/* ------------------------------------------- */}
          <Box sx={{ minHeight: "calc(100vh - 170px)" }}>{children}</Box>
          {/* ------------------------------------------- */}
          {/* End Page */}
          {/* ------------------------------------------- */}
        </Container>
      </PageWrapper>
    </MainWrapper>
  );
}
