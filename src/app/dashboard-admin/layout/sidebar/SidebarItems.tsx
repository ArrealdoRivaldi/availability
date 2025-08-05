import React from "react";
import { getMenuItemsByRole } from "./MenuItems";
import { Box, Badge, Chip } from "@mui/material";
import Logo from "../shared/logo/Logo";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconLayoutDashboard, IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { database } from '@/app/firebaseConfig';
import { ref, onValue } from 'firebase/database';

const SidebarItems = () => {
  const pathname = usePathname();
  const [role, setRole] = React.useState('user');
  const [approvalCount, setApprovalCount] = React.useState(0);
  const [expandedMenus, setExpandedMenus] = React.useState<string[]>([]);
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(localStorage.getItem('userRole') || 'user');
    }
  }, []);

  // Hook untuk mengambil jumlah data approval
  React.useEffect(() => {
    if (role === 'super_admin') {
      const dbRef = ref(database);
      const unsubscribe = onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const approvalData = Object.entries(data)
            .map(([id, value]: any) => ({ id, ...value }))
            .filter((row: any) => row.Status === 'Waiting approval');
          setApprovalCount(approvalData.length);
        } else {
          setApprovalCount(0);
        }
      });
      return () => unsubscribe();
    }
  }, [role]);

  const menuItems = getMenuItemsByRole(role);

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isSubmenuExpanded = (menuId: string) => expandedMenus.includes(menuId);
  const isSubmenuActive = (submenuHref: string) => pathname === submenuHref;

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

          // Handle menu items with submenus
          if (item.hasSubmenu && item.submenu) {
            const isExpanded = isSubmenuExpanded(item.id);
            const hasActiveSubmenu = item.submenu.some(sub => isSubmenuActive(sub.href));
            
            return (
              <Box key={item.id}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1.2,
                    borderRadius: 2,
                    color: hasActiveSubmenu ? '#1976d2' : '#222',
                    background: hasActiveSubmenu ? '#e3f2fd' : 'none',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      background: '#f5f5f5',
                    },
                  }}
                  onClick={() => toggleSubmenu(item.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Icon size={20} />
                    {item.title}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Badge notifikasi untuk menu Approval */}
                    {item.title === 'Approval' && role === 'super_admin' && approvalCount > 0 && (
                      <Chip
                        label={approvalCount}
                        size="small"
                        color="warning"
                        sx={{
                          minWidth: 20,
                          height: 20,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          '& .MuiChip-label': {
                            px: 0.5,
                          },
                        }}
                      />
                    )}
                    {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                  </Box>
                </Box>
                
                {/* Submenu */}
                {isExpanded && (
                  <Box sx={{ ml: 3, mt: 0.5 }}>
                    {item.submenu.map((subItem) => (
                      <Link href={subItem.href} key={subItem.id} style={{ textDecoration: 'none' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            color: isSubmenuActive(subItem.href) ? '#1976d2' : '#666',
                            background: isSubmenuActive(subItem.href) ? '#e3f2fd' : 'none',
                            fontWeight: 400,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '0.9rem',
                            '&:hover': {
                              background: '#f5f5f5',
                            },
                          }}
                        >
                          {subItem.title}
                        </Box>
                      </Link>
                    ))}
                  </Box>
                )}
              </Box>
            );
          }

          // Handle regular menu items without submenus
          return (
            <Link href={href} key={item.id} style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Icon size={20} />
                  {item.title}
                </Box>
                {/* Badge notifikasi untuk menu Approval */}
                {item.title === 'Approval' && role === 'super_admin' && approvalCount > 0 && (
                  <Chip
                    label={approvalCount}
                    size="small"
                    color="warning"
                    sx={{
                      minWidth: 20,
                      height: 20,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      '& .MuiChip-label': {
                        px: 0.5,
                      },
                    }}
                  />
                )}
              </Box>
            </Link>
          );
        })}
      </Box>
    </Box>
  );
};
export default SidebarItems;
