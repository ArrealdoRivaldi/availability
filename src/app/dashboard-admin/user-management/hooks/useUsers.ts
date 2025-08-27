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
    const q = query(usersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersData: User[] = [];
        snapshot.forEach((doc) => {
          usersData.push({
            id: doc.id,
            ...doc.data()
          } as User);
        });
        setUsers(usersData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching users:', err);
        setError('Failed to fetch users');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'users', userId));
      return true;
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const usersData: User[] = [];
      snapshot.forEach((doc) => {
        usersData.push({
          id: doc.id,
          ...doc.data()
        } as User);
      });
      
      setUsers(usersData);
      setError(null);
    } catch (err) {
      console.error('Error refreshing users:', err);
      setError('Failed to refresh users');
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
