import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  customUser: AppUser | null;
  activeUser: AppUser | null;
  loading: boolean;
  isGuest: boolean;
  guestUid: string | null;
  effectiveUserId: string | null;
  loginEmail: (e: string, p: string) => Promise<void>;
  signupEmail: (e: string, p: string, name: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  resetPassword: (e: string) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getEmailDocId = (email: string) => 'usr_' + email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [customUser, setCustomUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('petcare-custom-user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [guestUid, setGuestUid] = useState<string | null>(() => {
    return localStorage.getItem('petcare-guest-uid');
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setCustomUser(null);
        localStorage.removeItem('petcare-custom-user');
        setGuestUid(null);
        localStorage.removeItem('petcare-guest-uid');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      // Try Firebase auth first
      await signInWithEmailAndPassword(auth, cleanEmail, pass);
    } catch (err: any) {
      console.warn('Firebase Auth email login standard fallback:', err.code || err.message);
      // Fallback to custom Firestore account
      const docId = getEmailDocId(cleanEmail);
      const userDocRef = doc(db, 'custom_users', docId);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.password && data.password !== pass) {
          throw new Error('Senha incorreta. Verifique seus dados e tente novamente.');
        }
        const cUser: AppUser = {
          uid: docId,
          email: data.email || cleanEmail,
          displayName: data.name || cleanEmail.split('@')[0]
        };
        setCustomUser(cUser);
        localStorage.setItem('petcare-custom-user', JSON.stringify(cUser));
        setGuestUid(null);
        localStorage.removeItem('petcare-guest-uid');
      } else {
        throw new Error('E-mail não cadastrado. Mude para a aba "Cadastrar" para criar sua conta.');
      }
    }
  };

  const signupEmail = async (email: string, pass: string, name: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];
    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (res.user) {
        await updateProfile(res.user, { displayName: cleanName });
      }
    } catch (err: any) {
      console.warn('Firebase Auth email signup fallback to Firestore users:', err.code || err.message);
      const docId = getEmailDocId(cleanEmail);
      const userDocRef = doc(db, 'custom_users', docId);
      
      // Save user to Firestore
      await setDoc(userDocRef, {
        email: cleanEmail,
        name: cleanName,
        password: pass,
        createdAt: new Date().toISOString()
      }, { merge: true });

      const cUser: AppUser = {
        uid: docId,
        email: cleanEmail,
        displayName: cleanName
      };
      setCustomUser(cUser);
      localStorage.setItem('petcare-custom-user', JSON.stringify(cUser));
      setGuestUid(null);
      localStorage.removeItem('petcare-guest-uid');
    }
  };

  const loginGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn('Firebase Auth Google popup fallback:', err.code || err.message);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.warn('Password reset fallback:', err);
    }
  };

  const loginAsGuest = () => {
    let gId = localStorage.getItem('petcare-guest-uid');
    if (!gId) {
      gId = 'guest_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('petcare-guest-uid', gId);
    }
    setCustomUser(null);
    localStorage.removeItem('petcare-custom-user');
    setGuestUid(gId);
  };

  const logout = async () => {
    if (user) {
      await firebaseSignOut(auth);
    }
    setCustomUser(null);
    localStorage.removeItem('petcare-custom-user');
    setGuestUid(null);
    localStorage.removeItem('petcare-guest-uid');
  };

  // Resolve active user (Firebase user or custom user)
  const activeUser: AppUser | null = user
    ? { uid: user.uid, email: user.email || '', displayName: user.displayName || user.email?.split('@')[0] || 'Tutor' }
    : customUser;

  const isGuest = !activeUser && !!guestUid;
  const effectiveUserId = activeUser ? activeUser.uid : guestUid;

  return (
    <AuthContext.Provider
      value={{
        user,
        customUser,
        activeUser,
        loading,
        isGuest,
        guestUid,
        effectiveUserId,
        loginEmail,
        signupEmail,
        loginGoogle,
        resetPassword,
        loginAsGuest,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

