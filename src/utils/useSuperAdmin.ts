import { useState, useEffect } from 'react';

export const useSuperAdmin = () => {
  const [isSuperAdminState, setIsSuperAdminState] = useState<boolean | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSuper = localStorage.getItem('userRole') === 'super_admin';
      setIsSuperAdminState(isSuper);
      if (!isSuper) {
        setRedirecting(true);
        const timer = setTimeout(() => {
          window.location.href = '/dashboard-admin';
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  return {
    isSuperAdmin: isSuperAdminState,
    redirecting,
    isLoading: isSuperAdminState === null
  };
};
