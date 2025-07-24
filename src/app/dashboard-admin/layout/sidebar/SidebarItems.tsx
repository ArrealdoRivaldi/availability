import React from "react";
import { getMenuItemsByRole } from "./MenuItems";
import { Box } from "@mui/material";
import Logo from "../shared/logo/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconLayoutDashboard } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

const SidebarItems = () => {
  const pathname = usePathname();
  const pathDirect = pathname;
  const [role, setRole] = React.useState('user');
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(localStorage.getItem('userRole') || 'user');
    }
  }, []);
  let menuItems = getMenuItemsByRole(role);
  // Filter menu CRUD hanya untuk super_admin
  if (role !== 'super_admin') {
    menuItems = menuItems.filter(item => item.href !== '/dashboard-admin/crud');
  }
  const router = useRouter();
  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Logo />
      <Box mt={4}>
        {menuItems.map((item) => {
          const Icon = item.icon ? item.icon : IconLayoutDashboard;
          const href = item.href || "#";
          if (href === '/logout') {
            return (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.2,
                  borderRadius: 2,
                  color: '#e53935',
                  background: 'none',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: '#f5f5f5',
                  },
                }}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('hideApprovalMenu');
                  }
                  router.push('/');
                }}
              >
                <Icon size={20} />
                {item.title}
              </Box>
            );
          }
          return (
            <Link href={href} key={item.id} style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.2,
                  borderRadius: 2,
                  color: pathDirect === href ? '#1976d2' : '#222',
                  background: pathDirect === href ? '#e3f2fd' : 'none',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: '#f5f5f5',
                  },
                }}
              >
                <Icon size={20} />
                {item.title}
              </Box>
            </Link>
          );
        })}
      </Box>
    </Box>
  );
};
export default SidebarItems;
