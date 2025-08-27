import { User } from '../hooks/useUsers';

export function filterUsers(
  users: User[],
  searchTerm: string,
  selectedNop: string,
  selectedRole: string
): User[] {
  return users.filter((user) => {
    // Search filter
    const matchesSearch = !searchTerm || 
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    // NOP filter
    const matchesNop = !selectedNop || user.nop === selectedNop;

    // Role filter
    const matchesRole = !selectedRole || user.role === selectedRole;

    return matchesSearch && matchesNop && matchesRole;
  });
}

export function getFilterStats(users: User[], filteredUsers: User[]) {
  return {
    total: users.length,
    filtered: filteredUsers.length,
    showing: filteredUsers.length
  };
}

export function getNopOptions() {
  return [
    { value: '', label: 'All NOP' },
    { value: 'kalimantan', label: 'Kalimantan' },
    { value: 'sumatra', label: 'Sumatra' },
    { value: 'jawa', label: 'Jawa' },
    { value: 'sulawesi', label: 'Sulawesi' },
    { value: 'papua', label: 'Papua' }
  ];
}

export function getRoleOptions() {
  return [
    { value: '', label: 'All Roles' },
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' }
  ];
}

export function getNopCounts(users: User[]) {
  const counts: { [key: string]: number } = {};
  users.forEach(user => {
    counts[user.nop] = (counts[user.nop] || 0) + 1;
  });
  return counts;
}

export function getRoleCounts(users: User[]) {
  const counts: { [key: string]: number } = {};
  users.forEach(user => {
    counts[user.role] = (counts[user.role] || 0) + 1;
  });
  return counts;
}
