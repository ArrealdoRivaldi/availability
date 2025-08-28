import { useState, useEffect } from 'react';

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<string>('');
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole') || '';
      setUserRole(role);
      setIsGuest(role === 'guest');
      setIsAdmin(role === 'admin');
      setIsSuperAdmin(role === 'super_admin');
    }
  }, []);

  const canWrite = !isGuest;
  const canApprove = isSuperAdmin;
  const canManageUsers = isSuperAdmin;

  return {
    userRole,
    isGuest,
    isAdmin,
    isSuperAdmin,
    canWrite,
    canApprove,
    canManageUsers,
  };
};

export default useUserRole;
