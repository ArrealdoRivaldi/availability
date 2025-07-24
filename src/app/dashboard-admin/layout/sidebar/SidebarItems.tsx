import React from "react";
import { getMenuItemsByRole } from "./MenuItems";
import { Box } from "@mui/material";
import Logo from "../shared/logo/Logo";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconLayoutDashboard } from "@tabler/icons-react";

const SidebarItems = () => {
  const pathname = usePathname();
  const [role, setRole] = React.useState('user');
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(localStorage.getItem('userRole') || 'user');
    }
  }, []);

  const menuItems = getMenuItemsByRole(role);

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
                  color: pathname === href ? '#1976d2' : '#222',
                  background: pathname === href ? '#e3f2fd' : 'none',
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
