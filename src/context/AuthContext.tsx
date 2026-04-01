import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, deleteUser, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, getDocFromServer } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db, googleProvider, storage } from '../lib/firebase';

import { LoadingScreen } from '../components/LoadingScreen';
import { resizeImage } from '../utils/imageUtils';

export type UserRole = 'admin' | 'agent' | 'user' | 'resort';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  createdAt: string;
  phone?: string;
  whatsapp?: string;
  bio?: string;
  instagram?: string;
  facebook?: string;
  agencyName?: string;
  resortName?: string;
  resortDescription?: string;
  resortPhotos?: string[];
  resortAmenities?: string[];
  resortLocation?: string;
  isApproved?: boolean;
  rating?: number;
  reviews?: number;
  isResponsible?: boolean;
  favorites?: string[];
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (role?: UserRole) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string, role?: UserRole, file?: File | null) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  deleteUserAccount: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        setCurrentUser(user);
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDocFromServer(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            // Force admin role for this specific email
            if (user.email?.toLowerCase() === 'desartstudiopro@gmail.com' && data.role !== 'admin') {
              data.role = 'admin';
              data.isApproved = true;
              
              const updatePayload: any = { role: 'admin', isApproved: true };
              if (!data.createdAt) {
                data.createdAt = new Date().toISOString();
                updatePayload.createdAt = data.createdAt;
              }
              if (!data.uid) {
                data.uid = user.uid;
                updatePayload.uid = user.uid;
              }
              if (!data.email) {
                data.email = user.email;
                updatePayload.email = user.email;
              }
              
              try {
                await updateDoc(userRef, updatePayload);
              } catch (updateError) {
                console.error("Error updating admin role in Firestore:", updateError);
                // Even if Firestore update fails, we set the profile locally so they can access the app
              }
            }
            setUserProfile(data);
          } else {
            const role: UserRole = user.email?.toLowerCase() === 'desartstudiopro@gmail.com' ? 'admin' : 'user';
            
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
              role,
              isApproved: role === 'admin',
              createdAt: new Date().toISOString()
            };
            
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (role: UserRole = 'user') => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Ensure user is in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const finalRole: UserRole = user.email?.toLowerCase() === 'desartstudiopro@gmail.com' ? 'admin' : role;
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: finalRole,
          isApproved: finalRole === 'admin' || finalRole === 'user',
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      } else {
        const data = userSnap.data() as UserProfile;
        if (user.email?.toLowerCase() === 'desartstudiopro@gmail.com' && data.role !== 'admin') {
          data.role = 'admin';
          data.isApproved = true;
          
          const updatePayload: any = { role: 'admin', isApproved: true };
          if (!data.createdAt) {
            data.createdAt = new Date().toISOString();
            updatePayload.createdAt = data.createdAt;
          }
          if (!data.uid) {
            data.uid = user.uid;
            updatePayload.uid = user.uid;
          }
          if (!data.email) {
            data.email = user.email;
            updatePayload.email = user.email;
          }
          
          try {
            await updateDoc(userRef, updatePayload);
          } catch (updateError) {
            console.error("Error updating admin role in Firestore during login:", updateError);
          }
        }
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        throw new Error('email-not-verified');
      }
    } catch (error) {
      console.error("Error signing in with email", error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, password: string, name: string, role: UserRole = 'user', file?: File | null) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        let uploadedPhotoURL = '';

        if (file) {
          try {
            uploadedPhotoURL = await resizeImage(file, 200, 200);
          } catch (uploadError) {
            console.error("Error processing profile picture during registration:", uploadError);
            // Continue registration even if photo processing fails
          }
        }

        await updateProfile(userCredential.user, {
          displayName: name,
          photoURL: uploadedPhotoURL
        });
        
        // Add user to Firestore immediately upon registration
        const userRef = doc(db, 'users', userCredential.user.uid);
        const finalRole: UserRole = email?.toLowerCase() === 'desartstudiopro@gmail.com' ? 'admin' : role;
        const newProfile: UserProfile = {
          uid: userCredential.user.uid,
          email: email,
          displayName: name,
          photoURL: uploadedPhotoURL,
          role: finalRole,
          isApproved: finalRole === 'admin' || finalRole === 'user',
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, newProfile);

        await sendEmailVerification(userCredential.user);
        await signOut(auth);
      }
    } catch (error) {
      console.error("Error registering with email", error);
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;
    try {
      // Update Firebase Auth profile if name or photo changed
      if (data.displayName !== undefined || data.photoURL !== undefined) {
        const updateData: { displayName?: string | null; photoURL?: string | null } = {};
        
        if (data.displayName !== undefined) {
          updateData.displayName = data.displayName;
        }
        
        // Only update photoURL in Firebase Auth if it's not a base64 string
        // Firebase Auth has a strict length limit for photoURL
        if (data.photoURL !== undefined) {
          if (data.photoURL && data.photoURL.startsWith('data:image/')) {
            // Skip updating Firebase Auth photoURL, we'll just store it in Firestore
          } else {
            updateData.photoURL = data.photoURL;
          }
        }

        if (Object.keys(updateData).length > 0) {
          await updateProfile(currentUser, updateData);
        }
      }
      
      // Update Firestore document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, data);
      
      // Update agent data in all properties owned by this user
      try {
        const propertiesRef = collection(db, 'properties');
        const q = query(propertiesRef, where('agentId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const updatePromises = querySnapshot.docs.map(propertyDoc => {
          const propertyData = propertyDoc.data();
          const currentAgent = propertyData.agent || {};
          
          return updateDoc(doc(db, 'properties', propertyDoc.id), {
            agent: {
              ...currentAgent,
              ...(data.displayName !== undefined && { name: data.displayName }),
              ...(data.phone !== undefined && { phone: data.phone }),
              ...(data.whatsapp !== undefined && { whatsapp: data.whatsapp }),
              ...(data.photoURL !== undefined && { avatar: data.photoURL }),
              ...(data.agencyName !== undefined && { agency: data.agencyName }),
              ...(data.bio !== undefined && { bio: data.bio }),
              ...(data.instagram !== undefined && { instagram: data.instagram }),
              ...(data.facebook !== undefined && { facebook: data.facebook })
            }
          });
        });
        
        await Promise.all(updatePromises);
      } catch (propUpdateError) {
        console.error("Error updating properties with new agent profile", propUpdateError);
      }
      
      // Update local state
      setUserProfile({ ...userProfile, ...data });
    } catch (error) {
      console.error("Error updating profile", error);
      throw error;
    }
  };

  const deleteUserAccount = async () => {
    if (!currentUser) return;
    try {
      // Delete Firestore document
      const userRef = doc(db, 'users', currentUser.uid);
      await deleteDoc(userRef);
      
      // Delete Firebase Auth user
      await deleteUser(currentUser);
      
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Error deleting account", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error sending password reset email", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, login, loginWithEmail, registerWithEmail, updateUserProfile, deleteUserAccount, logout, resetPassword }}>
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
