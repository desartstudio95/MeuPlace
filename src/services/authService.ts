import { collection, doc, updateDoc, deleteDoc, query, getDocsFromServer, getDocFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/context/AuthContext';
import { handleFirestoreError, OperationType } from '@/lib/firestoreUtils';

export const authService = {
  async getUsers() {
    const path = 'users';
    try {
      const q = query(collection(db, path));
      const snapshot = await getDocsFromServer(q);
      return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getUser(uid: string) {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDocFromServer(docRef);
      if (docSnap.exists()) {
        return { uid: docSnap.id, ...docSnap.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async updateUserRole(uid: string, role: 'admin' | 'agent' | 'user' | 'resort') {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, { role });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async approveUser(uid: string) {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, { isApproved: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deactivateUser(uid: string) {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, { isApproved: false });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteUser(uid: string) {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>) {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
};
