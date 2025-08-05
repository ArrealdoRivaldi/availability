import { IconLayoutDashboard, IconLogout } from "@tabler/icons-react";
import { uniqueId } from "lodash";

const allMenuitems = [
  {
    id: uniqueId(),
    title: "Dashboard",
    icon: IconLayoutDashboard,
    href: "/dashboard-admin",
  },
  {
    id: uniqueId(),
    title: "Data",
    icon: IconLayoutDashboard,
    href: "/dashboard-admin/data",
  },
  {
    id: uniqueId(),
    title: "Approval",
    icon: IconLayoutDashboard,
    href: "/dashboard-admin/approval",
  },
  {
    id: uniqueId(),
    title: "Logs",
    icon: IconLayoutDashboard,
    href: "/dashboard-admin/logs",
  },
  {
    id: uniqueId(),
    title: "CRUD",
    icon: IconLayoutDashboard,
    href: "/dashboard-admin/crud",
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


