import { useState, useEffect } from 'react';
import { auth } from '@/app/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

export interface UserRole {
  role: 'super_admin' | 'admin' | 'guest' | null;
  email: string | null;
  displayName: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>({
    role: null,
    email: null,
    displayName: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage first for guest/admin/super_admin roles
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole') as 'super_admin' | 'admin' | 'guest' | null;
      
      if (role) {
        // User has role from localStorage (guest, admin, or super_admin)
        setUserRole({
          role,
          email: role === 'guest' ? 'guest@example.com' : null,
          displayName: role === 'guest' ? 'Guest User' : null
        });
        setIsLoading(false);
        return;
      }
    }

    // If no role in localStorage, check Firebase auth
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Get role from localStorage (set during login)
        if (typeof window !== 'undefined') {
          const role = localStorage.getItem('userRole') as 'super_admin' | 'admin' | 'guest' | null;
          setUserRole({
            role,
            email: user.email,
            displayName: user.displayName
          });
        }
      } else {
        setUser(null);
        setUserRole({
          role: null,
          email: null,
          displayName: null
        });
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      // Only signOut from Firebase if user is not guest
      if (user && userRole.role !== 'guest' && auth) {
        await auth.signOut();
      }
      
      // Clear localStorage for all users
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userRole');
        localStorage.removeItem('hideApprovalMenu');
      }
      
      setUser(null);
      setUserRole({
        role: null,
        email: null,
        displayName: null
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Guest, admin, dan super_admin dianggap authenticated
  const isAuthenticated = !!userRole.role;
  const isSuperAdmin = userRole.role === 'super_admin';
  const isAdmin = userRole.role === 'admin';
  const isGuest = userRole.role === 'guest';

  return {
    user,
    userRole,
    isLoading,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isGuest,
    logout
  };
};
