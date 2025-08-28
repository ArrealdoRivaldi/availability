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
];

export function getMenuItemsByRole(role: string) {
  if (role === 'super_admin') {
    // Semua menu
    return allMenuitems;
  }
  if (role === 'admin' || role === 'guest') {
    // Hanya Worst Site Availability (hanya Dashboard & Data), Cell Down (hanya Dashboard & Data), & Logout
    return allMenuitems
      .filter(item => ["Worst Site Availability", "Cell Down", "Logout"].includes(item.title))
      .map(item => {
        if (item.title === "Worst Site Availability" || item.title === "Cell Down") {
          // Filter hanya "Dashboard" dan "Data" submenu untuk admin dan guest
          return {
            ...item,
            submenu: item.submenu?.filter(subItem => 
              ["Dashboard", "Data"].includes(subItem.title)
            )
          };
        }
        return item;
      });
  }
  // Default: hanya Worst Site Availability (hanya Dashboard & Data), Cell Down (hanya Dashboard & Data), & Logout
  return allMenuitems
    .filter(item => ["Worst Site Availability", "Cell Down", "Logout"].includes(item.title))
    .map(item => {
      if (item.title === "Worst Site Availability" || item.title === "Cell Down") {
        // Filter hanya "Dashboard" dan "Data" submenu untuk non-super_admin roles
        return {
          ...item,
          submenu: item.submenu?.filter(subItem => 
            ["Dashboard", "Data"].includes(subItem.title)
          )
        };
      }
      return item;
    });
}

export default allMenuitems;


