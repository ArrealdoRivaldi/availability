import { IconLogout, IconWifi, IconWifiOff, IconUsers } from "@tabler/icons-react";
import { uniqueId } from "lodash";

const allMenuitems = [
  {
    id: uniqueId(),
    title: "Worst Site Availability",
    icon: IconWifi,
    href: "/dashboard-admin/availability",
    submenu: [
      {
        id: uniqueId(),
        title: "Dashboard",
        href: "/dashboard-admin/dashboard/Availability",
      },
      {
        id: uniqueId(),
        title: "Data",
        href: "/dashboard-admin/data/Availability",
      },
      {
        id: uniqueId(),
        title: "Approval",
        href: "/dashboard-admin/approval/Availability",
      },
      {
        id: uniqueId(),
        title: "Logs",
        href: "/dashboard-admin/logs/Availability",
      },
      {
        id: uniqueId(),
        title: "CRUD",
        href: "/dashboard-admin/crud/Availability",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Cell Down",
    icon: IconWifiOff,
    href: "/dashboard-admin/cell-down",
    submenu: [
      {
        id: uniqueId(),
        title: "Dashboard",
        href: "/dashboard-admin/dashboard/cell-down",
      },
      {
        id: uniqueId(),
        title: "Data",
        href: "/dashboard-admin/data/cell-down",
      },
      {
        id: uniqueId(),
        title: "Approval",
        href: "/dashboard-admin/approval/cell-down",
      },
      {
        id: uniqueId(),
        title: "Logs",
        href: "/dashboard-admin/logs/cell-down",
      },
      {
        id: uniqueId(),
        title: "CRUD",
        href: "/dashboard-admin/crud/cell-down",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "User Management",
    icon: IconUsers,
    href: "/dashboard-admin/user-management",
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
    // Hanya Worst Site Availability, Cell Down, User Management & Logout
    return allMenuitems.filter(item => ["Worst Site Availability", "Cell Down", "User Management", "Logout"].includes(item.title));
  }
  // Default: hanya Worst Site Availability, Cell Down, User Management & Logout
  return allMenuitems.filter(item => ["Worst Site Availability", "Cell Down", "User Management", "Logout"].includes(item.title));
}

export default allMenuitems;


