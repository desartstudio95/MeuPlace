import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '@/lib/firebase';
import { Property } from '@/types';

export const propertyService = {
  async getProperties() {
    const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
  },

  async getProperty(id: string) {
    const docRef = doc(db, 'properties', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Property;
    }
    return null;
  },

  async createProperty(propertyData: Omit<Property, 'id'>) {
    const docRef = await addDoc(collection(db, 'properties'), propertyData);
    return docRef.id;
  },

  async updateProperty(id: string, propertyData: Partial<Property>) {
    const docRef = doc(db, 'properties', id);
    await updateDoc(docRef, propertyData);
  },

  async approveProperty(id: string) {
    const docRef = doc(db, 'properties', id);
    await updateDoc(docRef, { status: 'Disponível', isApproved: true });
  },

  async rejectProperty(id: string) {
    const docRef = doc(db, 'properties', id);
    await updateDoc(docRef, { status: 'Pendente', isApproved: false });
  },

  async deleteProperty(id: string) {
    const docRef = doc(db, 'properties', id);
    await deleteDoc(docRef);
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
