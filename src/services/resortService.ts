import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Resort } from '@/types';

const COLLECTION_NAME = 'resorts';

export const resortService = {
  async getResorts(): Promise<Resort[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resort[];
    } catch (error) {
      console.error('Error fetching resorts:', error);
      // Fallback if index doesn't exist
      const q = query(collection(db, COLLECTION_NAME));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resort[];
    }
  },

  async getResortById(id: string): Promise<Resort | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Resort;
      }
      return null;
    } catch (error) {
      console.error('Error fetching resort by id:', error);
      return null;
    }
  },

  async createResort(resortData: Omit<Resort, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...resortData,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating resort:', error);
      throw error;
    }
  },

  async updateResort(id: string, resortData: Partial<Resort>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, resortData);
    } catch (error) {
      console.error('Error updating resort:', error);
      throw error;
    }
  },

  async deleteResort(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting resort:', error);
      throw error;
    }
  }
};
