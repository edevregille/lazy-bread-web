import { auth } from './firebase';
import { signInAnonymously } from 'firebase/auth';

export async function testFirebaseConnection() {
  try {
    console.log('🧪 Testing Firebase connection...');
    
    // Try to sign in anonymously to test the connection
    const result = await signInAnonymously(auth);
    console.log('✅ Firebase connection successful!', result.user.uid);
    
    // Sign out immediately
    await auth.signOut();
    console.log('✅ Firebase test completed successfully');
    
    return true;
  } catch (error: unknown) {
    console.error('❌ Firebase connection test failed:', error);
    
    const firebaseError = error as { code?: string };
    
    if (firebaseError.code === 'auth/invalid-api-key') {
      console.error('🔑 API Key Issue:');
      console.error('- Check if the API key is correct');
      console.error('- Verify the Firebase project is active');
      console.error('- Ensure the project has Authentication enabled');
    } else if (firebaseError.code === 'auth/network-request-failed') {
      console.error('🌐 Network Issue:');
      console.error('- Check your internet connection');
      console.error('- Verify Firebase services are accessible');
    } else {
      console.error('❓ Unknown Firebase error:', firebaseError.code);
    }
    
    return false;
  }
}

// Auto-run test in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Wait a bit for Firebase to initialize
  setTimeout(() => {
    testFirebaseConnection();
  }, 1000);
} 