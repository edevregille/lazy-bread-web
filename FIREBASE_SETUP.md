# Firebase Authentication Setup

This guide will help you set up Firebase authentication for the Lazy Bread web application.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "lazy-bread-web")
4. Follow the setup wizard (you can disable Google Analytics if not needed)
5. Click "Create project"

## 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Click "Save"

## 3. Set up Firestore Database

1. In your Firebase project, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for development (you can secure it later)
4. Select a location close to your users
5. Click "Done"

## 4. Get Firebase Configuration

1. In your Firebase project, click the gear icon next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>) to add a web app
5. Enter an app nickname (e.g., "lazy-bread-web")
6. Click "Register app"
7. Copy the Firebase configuration object

## 5. Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Keep your existing Stripe and reCAPTCHA configuration
```

Replace the values with the actual configuration from your Firebase project.

## 6. Firestore Security Rules

Update your Firestore security rules to allow authenticated users to read and write their own orders and profiles:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own orders
    match /orders/{orderId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.token.email == resource.data.email);
    }
    
    // Allow users to read and write their own profiles
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.uid;
    }
  }
}
```

## 7. Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to your application
3. Try signing up with a new account
4. Try signing in with the created account
5. Check that you can access the dashboard and see your orders
6. Test the payment methods management (requires Stripe setup)
7. Verify that orders are saved to Firebase when authenticated

## Features Added

- **User Authentication**: Sign up and sign in with email/password
- **User Dashboard**: View all your orders in one place
- **Order History**: See order status, details, and delivery information
- **Profile Management**: View profile and sign out
- **Automatic Order Saving**: Orders are automatically saved to Firebase when authenticated
- **Stripe Customer Integration**: Automatic Stripe customer creation for new users
- **Payment Method Management**: Save, view, and manage payment methods
- **Default Payment Method**: Set and manage default payment methods for faster checkout

## Security Notes

- All Firebase configuration keys are prefixed with `NEXT_PUBLIC_` which means they are exposed to the client
- This is normal for Firebase web apps as these keys are meant to be public
- The actual security is handled by Firebase Authentication and Firestore security rules
- Make sure to set up proper Firestore security rules before going to production

## Troubleshooting

- If you get authentication errors, make sure Email/Password authentication is enabled in Firebase
- If you can't see orders, check that Firestore is set up and the security rules allow access
- If the app doesn't load, verify all environment variables are set correctly 