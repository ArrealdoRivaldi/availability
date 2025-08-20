import { IconLayoutDashboard, IconLogout, IconDatabase, IconClipboardList, IconFileAnalytics, IconEdit, IconChevronDown } from "@tabler/icons-react";
import { uniqueId } from "lodash";

const allMenuitems = [
  {
    id: uniqueId(),
    title: "Dashboard",
    icon: IconLayoutDashboard,
    href: "/dashboard-admin",
    submenu: [
      {
        id: uniqueId(),
        title: "Availability",
        href: "/dashboard-admin/dashboard/Availability",
      },
      {
        id: uniqueId(),
        title: "Cell Down",
        href: "/dashboard-admin/dashboard/cell-down",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Data",
    icon: IconDatabase,
    href: "/dashboard-admin/data",
    submenu: [
      {
        id: uniqueId(),
        title: "Availability",
        href: "/dashboard-admin/data/availability",
      },
      {
        id: uniqueId(),
        title: "Cell Down",
        href: "/dashboard-admin/data/cell-down",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Approval",
    icon: IconClipboardList,
    href: "/dashboard-admin/approval",
    submenu: [
      {
        id: uniqueId(),
        title: "Availability",
        href: "/dashboard-admin/approval/availability",
      },
      {
        id: uniqueId(),
        title: "Cell Down",
        href: "/dashboard-admin/approval/cell-down",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Logs",
    icon: IconFileAnalytics,
    href: "/dashboard-admin/logs",
    submenu: [
      {
        id: uniqueId(),
        title: "Availability",
        href: "/dashboard-admin/logs/availability",
      },
      {
        id: uniqueId(),
        title: "Cell Down",
        href: "/dashboard-admin/logs/cell-down",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "CRUD",
    icon: IconEdit,
    href: "/dashboard-admin/crud",
    submenu: [
      {
        id: uniqueId(),
        title: "Availability",
        href: "/dashboard-admin/crud/availability",
      },
      {
        id: uniqueId(),
        title: "Cell Down",
        href: "/dashboard-admin/crud/cell-down",
      },
    ],
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


