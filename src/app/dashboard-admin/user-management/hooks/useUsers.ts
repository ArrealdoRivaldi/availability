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
    const usersRef = collection(db, 'users');
    const basicQuery = query(usersRef);
    
    const unsubscribe = onSnapshot(
      basicQuery,
      (snapshot) => {
        const usersData: User[] = [];
        snapshot.forEach((doc) => {
          const userData = doc.data();
          usersData.push({
            id: doc.id,
            ...userData
          } as User);
        });
        
        setUsers(usersData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Failed to fetch users: ${errorMessage}`);
        setLoading(false);
      }
    );

    // Also try a one-time fetch to see if there are any immediate issues
    getDocs(basicQuery)
      .then((snapshot) => {
        if (snapshot.empty) {
          setError('No users found in the collection');
        }
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`One-time fetch failed: ${errorMessage}`);
      });

    return () => {
      unsubscribe();
    };
  }, []);

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'users', userId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to delete user: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const usersData: User[] = [];
      snapshot.forEach((doc) => {
        const userData = doc.data();
        usersData.push({
          id: doc.id,
          ...userData
        } as User);
      });
      
      setUsers(usersData);
      setError(null);
    } catch (err) {
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
