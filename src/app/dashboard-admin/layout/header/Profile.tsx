import React, { useState, useEffect } from "react";
import {
  Avatar,
  Box,
  Menu,
  IconButton,
  Button,
  Typography,
  ListItemIcon,
} from "@mui/material";
import { IconLogout } from "@tabler/icons-react";
import { auth, db } from "@/app/firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const Profile = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Refresh data user Google Auth agar photoURL selalu update
        await firebaseUser.reload();
      }
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserInfo(userSnap.data());
        } else {
          setUserInfo(null);
        }
      } else {
        setUserInfo(null);
      }
      setLoadingUser(false); // selesai load
    });
    return () => unsubscribe();
  }, []);

  // Jangan render apapun sebelum data user selesai di-load, saat logout, atau jika user null
  if (loadingUser || loggingOut || !user) return null;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut(auth);
    setAnchorEl(null);
    window.location.href = "/";
  };

  return (
    <Box>
      <IconButton
        size="large"
        color="inherit"
        aria-controls="profile-menu"
        aria-haspopup="true"
        onClick={handleClick}
      >
        <Avatar
          src={user?.photoURL || "/images/profile/user-1.jpg"}
          alt={userInfo?.displayName || user?.displayName || "User"}
          sx={{ width: 35, height: 35 }}
        />
      </IconButton>
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        sx={{
          "& .MuiMenu-paper": {
            width: "260px",
            p: 2,
          },
        }}
      >
        {user && (
          <Box px={2} py={1}>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Avatar
                src={user?.photoURL || "/images/profile/user-1.jpg"}
                alt={userInfo?.displayName || user?.displayName || "User"}
                sx={{ width: 48, height: 48 }}
              />
              <Box>
                <Typography fontWeight={700}>{userInfo?.displayName || user?.displayName || "User"}</Typography>
                <Typography variant="body2" color="text.secondary">{userInfo?.email || user?.email}</Typography>
                {userInfo?.role && (
                  <Typography variant="caption" color="primary.main" fontWeight={600}>
                    {userInfo.role}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}
        <Box px={2} pb={2}>
          <Button
            onClick={handleLogout}
            variant="outlined"
            color="primary"
            fullWidth
            startIcon={<ListItemIcon sx={{ minWidth: 0 }}><IconLogout size={20} /></ListItemIcon>}
            sx={{
              fontWeight: 600,
              borderRadius: 2,
              py: 1.2,
              mt: 1,
              textTransform: 'none',
              fontSize: 16,
              letterSpacing: 0.2,
              boxShadow: '0 2px 8px 0 rgba(30,58,138,0.08)',
              '&:hover': { bgcolor: 'primary.light', borderColor: 'primary.main' },
            }}
          >
            Logout
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;
