import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { 
  Subscription, 
  Order, 
  UserProfile as BaseUserProfile 
} from '@/lib/types';
import { auth } from './firebase'; // Added missing import for auth

// Extend the base UserProfile for Firebase-specific fields
export interface UserProfile extends BaseUserProfile {
  id?: string;
  displayName: string;
  defaultPaymentMethodId?: string;
  deliveryCity?: string;
  deliveryState?: string;
}

export const getUserOrders = async (email: string): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('email', '==', email),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Order);
    });
    
    return orders;
  } catch (error) {
    // Don't log the error here since it's expected when index doesn't exist
    // The dashboard will handle it gracefully
    throw error;
  }
};

// Alternative function that doesn't require a composite index
export const getUserOrdersWithoutIndex = async (email: string): Promise<Order[]> => {
  try {
    // Check if user is authenticated before making the request
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('User not authenticated, skipping orders fetch');
      return [];
    }

    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('email', '==', email)
    );
    
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Order);
    });
    
    // Sort in memory instead of in the query
    orders.sort((a, b) => {
      const dateA = a.createdAt || new Date(0);
      const dateB = b.createdAt || new Date(0);
      return dateB.getTime() - dateA.getTime(); // Descending order
    });
    
    return orders;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    
    // Handle specific Firebase permission errors gracefully
    if (error instanceof Error) {
      if (error.message.includes('permission-denied') || 
          error.message.includes('Missing or insufficient permissions')) {
        console.log('Permission denied - user may not be authenticated');
        return [];
      }
      if (error.message.includes('unauthenticated')) {
        console.log('User not authenticated');
        return [];
      }
    }
    
    throw new Error('Failed to fetch orders');
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    // Check if user is authenticated before making the request
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('User not authenticated, skipping profile fetch');
      return null;
    }

    const userRef = collection(db, 'users');
    const q = query(userRef, where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    
    // Handle specific Firebase permission errors gracefully
    if (error instanceof Error) {
      if (error.message.includes('permission-denied') || 
          error.message.includes('Missing or insufficient permissions')) {
        console.log('Permission denied - user may not be authenticated');
        return null;
      }
      if (error.message.includes('unauthenticated')) {
        console.log('User not authenticated');
        return null;
      }
    }
    
    // For other errors, still throw to maintain existing behavior
    throw new Error('Failed to fetch user profile');
  }
};

export const createUserProfile = async (userData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {    
    const userToSave = {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'users'), userToSave);
    return docRef.id;
  } catch (error) {
    console.error('Error creating user profile:', error);
    
    // Log more specific error information
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check for specific Firebase error codes
      if (error.message.includes('permission-denied')) {
        throw new Error('Permission denied: Check Firestore security rules');
      }
      if (error.message.includes('unauthenticated')) {
        throw new Error('User not authenticated: Check authentication state');
      }
    }
    
    throw new Error('Failed to create user profile: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = collection(db, 'users');
    const q = query(userRef, where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('User profile not found');
    }
    
    const docRef = querySnapshot.docs[0].ref;
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
};

export const getUserSubscriptions = async (userId: string): Promise<Subscription[]> => {
  try {
    // Check if user is authenticated before making the request
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('User not authenticated, skipping subscriptions fetch');
      return [];
    }

    const subscriptionsRef = collection(db, 'subscriptions');
    const q = query(
      subscriptionsRef,
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const subscriptions: Subscription[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      subscriptions.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as unknown as Subscription);
    });
    return subscriptions;
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    
    // Handle specific Firebase permission errors gracefully
    if (error instanceof Error) {
      if (error.message.includes('permission-denied') || 
          error.message.includes('Missing or insufficient permissions')) {
        console.log('Permission denied - user may not be authenticated');
        return [];
      }
      if (error.message.includes('unauthenticated')) {
        console.log('User not authenticated');
        return [];
      }
    }
    
    throw new Error('Failed to fetch subscriptions');
  }
};

export const getSubscription = async (subscriptionId: string): Promise<Subscription | null> => {
  try {
    // Check if user is authenticated before making the request
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('User not authenticated, skipping subscription fetch');
      return null;
    }

    const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (!subscriptionDoc.exists()) {
      return null;
    }
    
    const data = subscriptionDoc.data();
    return {
      id: subscriptionDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as unknown as Subscription;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    
    // Handle specific Firebase permission errors gracefully
    if (error instanceof Error) {
      if (error.message.includes('permission-denied') || 
          error.message.includes('Missing or insufficient permissions')) {
        console.log('Permission denied - user may not be authenticated');
        return null;
      }
      if (error.message.includes('unauthenticated')) {
        console.log('User not authenticated');
        return null;
      }
    }
    
    throw new Error('Failed to fetch subscription');
  }
};

export const updateSubscription = async (subscriptionId: string, updates: Partial<Subscription>): Promise<void> => {
  try {
    const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
    await updateDoc(subscriptionRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw new Error('Failed to update subscription');
  }
};

export const pauseSubscription = async (subscriptionId: string): Promise<void> => {
  await updateSubscription(subscriptionId, { status: 'paused' });
};

export const resumeSubscription = async (subscriptionId: string): Promise<void> => {
  await updateSubscription(subscriptionId, { status: 'active' });
};

export const cancelSubscription = async (subscriptionId: string): Promise<void> => {
  await updateSubscription(subscriptionId, { status: 'cancelled' });
};

export const updateSubscriptionDeliveryAddress = async (
  subscriptionId: string, 
  addressData: {
    address: string;
    city: string;
    zipCode: string;
    phone: string;
  }
): Promise<void> => {
  try {
    const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
    await updateDoc(subscriptionRef, {
      ...addressData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating subscription delivery address:', error);
    throw new Error('Failed to update subscription delivery address');
  }
};
