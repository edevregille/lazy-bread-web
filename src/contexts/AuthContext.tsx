"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  UserCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, getUserProfile, UserProfile } from '@/lib/firebaseService';
import { createOrFindCustomer } from '@/lib/stripeService';
import { trackSignup } from '@/lib/gtag';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signingOut: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string, displayName: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  async function signUp(email: string, password: string, displayName: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name
    await updateProfile(result.user, { displayName });
    
    // Create user profile and Stripe customer
    try {
      const stripeCustomer = await createOrFindCustomer(email, displayName);
      if (stripeCustomer.id) {
        await createUserProfile({
          uid: result.user.uid,
          email: result.user.email!,
          displayName: displayName,
          stripeCustomerId: stripeCustomer.id,
        });
        
        // Track successful signup
        trackSignup('email');
      } else {
        throw new Error('Failed to create Stripe customer');
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      // Continue even if profile creation fails
    }
    
    return result;
  }

  function signIn(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    // Set signing out flag to prevent race conditions
    setSigningOut(true);
    
    // Clear user profile immediately to prevent race conditions
    setUserProfile(null);
    setCurrentUser(null);
    
    try {
      await signOut(auth);
    } finally {
      // Reset signing out flag after a short delay
      setTimeout(() => setSigningOut(false), 1000);
    }
  }

  async function resetPassword(email: string) {
    console.log('Resetting password for:', email);
    const response = await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent:', response);
    return ;
  }

  async function refreshUserProfile() {
    if (!currentUser || signingOut) {
      setUserProfile(null);
      return;
    }

    try {
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user && !signingOut) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
        }
      } else {
        // User is signed out, clear profile immediately
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [signingOut]);

  const value = {
    currentUser,
    userProfile,
    loading,
    signingOut,
    signIn,
    signUp,
    logout,
    resetPassword,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 