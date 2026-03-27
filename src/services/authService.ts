import { collection, doc, getDocs, getDoc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { UserProfile } from '@/context/AuthContext';

export const authService = {
  async getUsers() {
    const q = query(collection(db, 'users'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
  },

  async getUser(uid: string) {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { uid: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
  },

  async updateUserRole(uid: string, role: 'admin' | 'agent' | 'user' | 'resort') {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { role });
  },

  async approveUser(uid: string) {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { isApproved: true });
  },

  async deactivateUser(uid: string) {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { isApproved: false });
  },

  async deleteUser(uid: string) {
    const docRef = doc(db, 'users', uid);
    await deleteDoc(docRef);
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>) {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, data);
  }
};
