import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDocsFromServer, getDocFromServer } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Property } from '@/types';
import { handleFirestoreError, OperationType } from '@/lib/firestoreUtils';

export const propertyService = {
  async getProperties() {
    const path = 'properties';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocsFromServer(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getProperty(id: string) {
    const path = `properties/${id}`;
    try {
      const docRef = doc(db, 'properties', id);
      const docSnap = await getDocFromServer(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Property;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async createProperty(propertyData: Omit<Property, 'id'>) {
    const path = 'properties';
    try {
      const docRef = await addDoc(collection(db, path), propertyData);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async updateProperty(id: string, propertyData: Partial<Property>) {
    const path = `properties/${id}`;
    try {
      const docRef = doc(db, 'properties', id);
      await updateDoc(docRef, propertyData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async approveProperty(id: string) {
    const path = `properties/${id}`;
    try {
      const docRef = doc(db, 'properties', id);
      await updateDoc(docRef, { status: 'Disponível', isApproved: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async rejectProperty(id: string) {
    const path = `properties/${id}`;
    try {
      const docRef = doc(db, 'properties', id);
      await updateDoc(docRef, { status: 'Pendente', isApproved: false });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteProperty(id: string) {
    const path = `properties/${id}`;
    try {
      const docRef = doc(db, 'properties', id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async uploadImage(file: File): Promise<string> {
    const storageRef = ref(storage, `properties/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        null,
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  }
};
