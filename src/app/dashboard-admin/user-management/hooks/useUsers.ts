import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

export interface User {
  id: string;
  displayName: string;
  email: string;
  nop: string;
  role: string;
  createdAt?: any;
  lastLoginAt?: any;
  updatedAt?: any;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('useUsers: Starting to fetch users...');
    
    const usersRef = collection(db, 'users');
    console.log('useUsers: Collection reference created:', usersRef);
    
    // First, try to get users without ordering to see if basic access works
    const basicQuery = query(usersRef);
    
    const unsubscribe = onSnapshot(
      basicQuery,
      (snapshot) => {
        console.log('useUsers: Snapshot received, size:', snapshot.size);
        console.log('useUsers: Snapshot empty:', snapshot.empty);
        
        const usersData: User[] = [];
        snapshot.forEach((doc) => {
          const userData = doc.data();
          console.log('useUsers: User data:', { id: doc.id, ...userData });
          usersData.push({
            id: doc.id,
            ...userData
          } as User);
        });
        
        console.log('useUsers: Processed users:', usersData);
        setUsers(usersData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('useUsers: Error in onSnapshot:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Failed to fetch users: ${errorMessage}`);
        setLoading(false);
      }
    );

    // Also try a one-time fetch to see if there are any immediate issues
    getDocs(basicQuery)
      .then((snapshot) => {
        console.log('useUsers: One-time fetch successful, size:', snapshot.size);
        if (snapshot.empty) {
          console.log('useUsers: Collection is empty - no users found');
          setError('No users found in the collection');
        }
      })
      .catch((err) => {
        console.error('useUsers: One-time fetch failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`One-time fetch failed: ${errorMessage}`);
      });

    return () => {
      console.log('useUsers: Cleaning up subscription');
      unsubscribe();
    };
  }, []);

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'users', userId));
      return true;
    } catch (err) {
      console.error('Error deleting user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to delete user: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshUsers = async () => {
    try {
      console.log('useUsers: Manual refresh requested');
      setLoading(true);
      setError(null);
      
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      console.log('useUsers: Refresh successful, size:', snapshot.size);
      
      const usersData: User[] = [];
      snapshot.forEach((doc) => {
        const userData = doc.data();
        console.log('useUsers: Refresh user data:', { id: doc.id, ...userData });
        usersData.push({
          id: doc.id,
          ...userData
        } as User);
      });
      
      setUsers(usersData);
      setError(null);
    } catch (err) {
      console.error('Error refreshing users:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to refresh users: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
    deleteUser,
    refreshUsers
  };
}
