import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDocs, getDoc, where, getCountFromServer, limit } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase';
import { Property } from '@/types';
import { handleFirestoreError, OperationType } from '@/lib/firestoreUtils';

export const propertyService = {
  async getProperties(approvedOnly: boolean = true, maxLimit: number = 50) {
    const path = 'properties';
    try {
      const q = approvedOnly
        ? query(collection(db, path), where('isApproved', '==', true), limit(maxLimit))
        : query(collection(db, path), limit(maxLimit));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getPropertiesByAgent(agentId: string) {
    const path = 'properties';
    try {
      const q = query(collection(db, path), where('agentId', '==', agentId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getAgentPropertyCount(agentId: string) {
    const path = 'properties';
    try {
      const q = query(collection(db, path), where('agentId', '==', agentId));
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return 0;
    }
  },

  async getProperty(id: string) {
    const path = `properties/${id}`;
    try {
      const docRef = doc(db, 'properties', id);
      const docSnap = await getDoc(docRef);
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
    if (!file.type.startsWith('image/')) {
      throw new Error('Apenas arquivos de imagem são permitidos.');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('O arquivo excede o limite máximo permitido de 10MB.');
    }

    const userId = auth.currentUser?.uid || 'anonymous';
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageRef = ref(storage, `properties/${userId}/${Date.now()}_${sanitizedName}`);
    const metadata = {
      contentType: file.type,
    };
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);
    
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
  },

  async uploadDocument(file: File, folder: string = 'documents'): Promise<string> {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('O documento excede o limite máximo permitido de 10MB.');
    }

    const userId = auth.currentUser?.uid || 'anonymous';
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageRef = ref(storage, `${folder}/${userId}/${Date.now()}_${sanitizedName}`);
    const metadata = {
      contentType: file.type,
    };
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);
    
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
