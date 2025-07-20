import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Order {
  id?: string;
  items: OrderItem[];
  deliveryDate: string;
  address: string;
  city: string;
  zipCode: string;
  customerName: string;
  email: string;
  phone: string;
  comments: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  createdAt?: Date;
  userId?: string;
  // Recurring order metadata
  isRecurring?: boolean;
  recurringFrequency?: 'weekly' | 'biweekly' | 'monthly';
  recurringDayOfWeek?: number; // 0-6 (Sunday-Saturday)
  recurringStartDate?: string;
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
}

export interface UserProfile {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  stripeCustomerId?: string;
  defaultPaymentMethodId?: string;
  // Delivery address fields
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryZipCode?: string;
  deliveryState?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
    throw new Error('Failed to fetch orders');
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
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
    throw new Error('Failed to fetch user profile');
  }
};

export const createUserProfile = async (userData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    console.log('Creating user profile with data:', userData);
    
    const userToSave = {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log('Saving to Firestore with data:', userToSave);
    const docRef = await addDoc(collection(db, 'users'), userToSave);
    console.log('User profile document created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile');
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