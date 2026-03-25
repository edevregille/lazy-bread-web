import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';

let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0]!;
    return adminApp;
  }
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    adminApp = initializeApp({
      credential: cert(JSON.parse(json) as Parameters<typeof cert>[0]),
    });
    return adminApp;
  }
  adminApp = initializeApp({
    credential: applicationDefault(),
  });
  return adminApp;
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}

export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken> {
  return getAuth(getAdminApp()).verifyIdToken(idToken);
}

export type UserDocSnapshot = {
  docId: string;
  email?: string;
  displayName?: string;
  stripeCustomerId?: string;
};

export async function findUserDocByUid(uid: string): Promise<UserDocSnapshot | null> {
  const db = getAdminFirestore();
  const snap = await db.collection('users').where('uid', '==', uid).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data();
  return {
    docId: doc.id,
    email: typeof data.email === 'string' ? data.email : undefined,
    displayName: typeof data.displayName === 'string' ? data.displayName : undefined,
    stripeCustomerId: typeof data.stripeCustomerId === 'string' ? data.stripeCustomerId : undefined,
  };
}

export async function updateUserStripeCustomerId(
  docId: string,
  stripeCustomerId: string,
): Promise<void> {
  const db = getAdminFirestore();
  await db.collection('users').doc(docId).update({
    stripeCustomerId,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function createUserDocWithStripe(params: {
  uid: string;
  email: string;
  displayName?: string;
  stripeCustomerId: string;
}): Promise<void> {
  const db = getAdminFirestore();
  await db.collection('users').add({
    uid: params.uid,
    email: params.email,
    ...(params.displayName ? { displayName: params.displayName } : {}),
    stripeCustomerId: params.stripeCustomerId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function getAuthUserForUid(uid: string) {
  return getAuth(getAdminApp()).getUser(uid);
}
