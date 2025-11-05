import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsH-1Cvnw4IztS1joMEXKsNL-Es-j7ycM",
  authDomain: "blurb-b6fde.firebaseapp.com",
  projectId: "blurb-b6fde",
  storageBucket: "blurb-b6fde.firebasestorage.app",
  messagingSenderId: "160667736651",
  appId: "1:160667736651:web:47d62556c7b98b13ea0bce",
  measurementId: "G-0YDL94DM4L"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

function unameKey(u){
  return (u ?? '').trim().toLowerCase();
}

async function isUsernameAvailable(username){
  const key = unameKey(username);
  if (!key) return false;
  const uref = doc(db, 'usernames', key);
  const usnap = await getDoc(uref);
  return !usnap.exists();
}

async function reserveUsernameAndWriteProfile(uid, email, username){
  const key  = unameKey(username);
  const uref = doc(db, 'usernames', key);
  const pref = doc(db, 'profiles', uid);
  const display = username || (email?.split('@')[0] || 'Reader');

  await runTransaction(db, async (tx)=>{
    const taken = await tx.get(uref);
    if (taken.exists()) throw new Error('That username is already taken.');

    tx.set(uref, { uid, createdAt: serverTimestamp() });
    tx.set(pref, {
      email,
      displayName: display,
      username,
      usernameLower: key,
      createdAt: serverTimestamp(),
      role: 'reader'
    }, { merge: true });
  });
}

async function ensureUserProfile(uid, email, username){
  const pref = doc(db, 'profiles', uid);
  const snap = await getDoc(pref);
  const display = username || (email?.split('@')[0] || 'Reader');

  if (!snap.exists()) {
    await setDoc(pref, {
      email,
      displayName: display,
      username: username || null,
      usernameLower: username ? unameKey(username) : null,
      createdAt: serverTimestamp(),
      role: 'reader'
    });
  }
}

async function savePreferences(data){
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');

  const pref = doc(db, 'profiles', user.uid);
  await setDoc(pref, {
    hobbies: data.hobbies ?? [],
    genres:  data.genres  ?? [],
    updatedAt: serverTimestamp()
  }, { merge: true });
}

const API = {
  async signUp(email, password, username){
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await reserveUsernameAndWriteProfile(cred.user.uid, cred.user.email, username);
    return cred.user;
  },
  async signIn(email, password){
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserProfile(cred.user.uid, cred.user.email);
    return cred.user;
  },
  async signOut(){
    await signOut(auth);
  },
  isUsernameAvailable,
  savePreferences,
  onAuth(cb){
    return onAuthStateChanged(auth, cb);
  }
};

window.FirebaseAPI = API;
