/* Ambient module declarations for external libraries */

declare module '@hookform/resolvers/zod' {
  export const zodResolver: any;
}

declare module '@react-three/drei' {
  export const Image: any;
  export const ScrollControls: any;
  export const useScroll: any;
  export const Canvas: any;
}

declare module 'firebase/auth' {
  export const createUserWithEmailAndPassword: any;
  export const signInWithEmailAndPassword: any;
  export const signInWithPopup: any;
  export const signOut: any;
  export const updateProfile: any;
  export const onAuthStateChanged: any;
  export type User = any;
  export type UserCredential = any;
  export const GoogleAuthProvider: any;
  export const getAuth: any;
}

declare module 'firebase/firestore' {
  export const doc: any;
  export const getDoc: any;
  export const setDoc: any;
  export const serverTimestamp: any;
  export const collection: any;
  export const getDocs: any;
  export const query: any;
  export const where: any;
  export const orderBy: any;
  export const limit: any;
  export const getFirestore: any;
  export const onSnapshot: any;
  export const addDoc: any;
  export const updateDoc: any;
  export const deleteDoc: any;
}
