import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDocsFromServer, getDocFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Resort } from '@/types';
import { handleFirestoreError, OperationType } from '@/lib/firestoreUtils';

const COLLECTION_NAME = 'resorts';

export const resortService = {
  async getResorts(): Promise<Resort[]> {
    const path = COLLECTION_NAME;
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocsFromServer(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resort[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getResortById(id: string): Promise<Resort | null> {
    const path = `${COLLECTION_NAME}/${id}`;
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDocFromServer(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Resort;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async createResort(resortData: Omit<Resort, 'id'>): Promise<string> {
    const path = COLLECTION_NAME;
    try {
      const docRef = await addDoc(collection(db, path), {
        ...resortData,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async updateResort(id: string, resortData: Partial<Resort>): Promise<void> {
    const path = `${COLLECTION_NAME}/${id}`;
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, resortData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  async deleteResort(id: string): Promise<void> {
    const path = `${COLLECTION_NAME}/${id}`;
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    }
  }
};
