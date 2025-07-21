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
    title: "Logout",
    icon: IconLogout,
    href: "/logout",
  },
];

export function getMenuItemsByRole(role: string) {
  if (role === 'guest' || role === 'admin') {
    return allMenuitems.filter(item => item.title !== 'Approval');
  }
  return allMenuitems;
}

export default allMenuitems;


