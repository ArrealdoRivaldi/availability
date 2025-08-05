import { IconLayoutDashboard, IconLogout, IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { uniqueId } from "lodash";

const allMenuitems = [
  {
    id: uniqueId(),
    title: "Dashboard",
    icon: IconLayoutDashboard,
    href: "/dashboard-admin",
    hasSubmenu: true,
    submenu: [
      {
        id: uniqueId(),
        title: "Availability",
        href: "/dashboard-admin/availability",
      }
    ]
  },
  {
    id: uniqueId(),
    title: "Data",
    icon: IconLayoutDashboard,
    href: "/dashboard-admin/data",
    hasSubmenu: true,
    submenu: [
      {
        id: uniqueId(),
        title: "Availability",
        href: "/dashboard-admin/data/availability",
      }
    ]
  },
  {
    id: uniqueId(),
    title: "Approval",
    icon: IconLayoutDashboard,
    href: "/dashboard-admin/approval",
    hasSubmenu: true,
    submenu: [
      {
        id: uniqueId(),
        title: "Availability",
        href: "/dashboard-admin/approval/availability",
      }
    ]
  },
  {
    id: uniqueId(),
    title: "Logs",
    icon: IconLayoutDashboard,
    href: "/dashboard-admin/logs",
    hasSubmenu: true,
    submenu: [
      {
        id: uniqueId(),
        title: "Availability",
        href: "/dashboard-admin/logs/availability",
      }
    ]
  },
  {
    id: uniqueId(),
    title: "CRUD",
    icon: IconLayoutDashboard,
    href: "/dashboard-admin/crud",
    hasSubmenu: true,
    submenu: [
      {
        id: uniqueId(),
        title: "Availability",
        href: "/dashboard-admin/crud/availability",
      }
    ]
  },
  {
    id: uniqueId(),
    title: "Logout",
    icon: IconLogout,
    href: "/logout",
  },
];

export function getMenuItemsByRole(role: string) {
  if (role === 'super_admin') {
    // Semua menu
    return allMenuitems;
  }
  if (role === 'admin' || role === 'guest') {
    // Hanya Dashboard & Data & Logout
    return allMenuitems.filter(item => ["Dashboard", "Data", "Logout"].includes(item.title));
  }
  // Default: hanya Dashboard & Data & Logout
  return allMenuitems.filter(item => ["Dashboard", "Data", "Logout"].includes(item.title));
}

export default allMenuitems;


