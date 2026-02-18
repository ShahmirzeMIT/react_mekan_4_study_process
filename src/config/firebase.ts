import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import axios from "axios";
import { message } from "antd";
import { getStorage } from "firebase/storage";
import { callApiCoachConsole } from "@/utils/callApi";

// Environment variables
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;
const FIREBASE_APP_ID = import.meta.env.VITE_FIREBASE_APP_ID;
const FIREBASE_AUTH_DOMAIN = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_STORAGE_BUCKET = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const FIREBASE_MESSAGING_SENDER_ID = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const FIREBASE_MEASUREMENT_ID = import.meta.env.VITE_MEASUREMENT_ID;
const VITE_PROD = import.meta.env.VITE_PROD;

// Firebase Configuration
const firebaseConfig = {
	apiKey: API_KEY,
	authDomain: FIREBASE_AUTH_DOMAIN,
	projectId: FIREBASE_PROJECT_ID,
	storageBucket: FIREBASE_STORAGE_BUCKET,
	messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
	appId: FIREBASE_APP_ID,
	measurementId: FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore with conditional database name
const db = VITE_PROD ? getFirestore(app, VITE_PROD) : getFirestore(app,'langdp-psp');
const langDp = getFirestore(app,'langdp-psp');
const examDb = getFirestore(app, "test-exam");
const storage = getStorage(app);

// Authentication Providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Google Sign-In
const loginWithGoogle = async () => {
	try {
		const result = await signInWithPopup(auth, googleProvider);
		const idToken = await result.user.getIdToken();
		const res = await axios.post(BASE_URL + "/api/auth/google-login", { idToken });

		message.success(res.data.message);
		return res.data;
	} catch (err: any) {
		console.error("Google login error:", err);

		const errorMessage = err?.response?.data?.error;

		if (errorMessage?.includes("github")) {
			message.error("Bu istifadəçi artıq GitHub ilə qeydiyyatdan keçib.");
		} else if (errorMessage?.includes("local")) {
			message.error("Bu istifadəçi artıq Email və Şifrə ilə qeydiyyatdan keçib.");
		} else {
			message.error(errorMessage || "Google girişində xəta baş verdi.");
		}

		throw err;
	}
};

// GitHub Sign-In
const loginWithGitHub = async () => {
	try {
		const result = await signInWithPopup(auth, githubProvider);
		const idToken = await result.user.getIdToken();

		const res = await axios.post(BASE_URL + "/api/auth/github-login", { idToken });

		message.success(res.data.message);
		return res.data;
	} catch (err: any) {
		console.error("GitHub login error:", err);

		const errorMessage = err?.response?.data?.error;

		if (errorMessage?.includes("google")) {
			message.error("This user is already registered with Google.");
		} else if (errorMessage?.includes("local")) {
			message.error("This user has already registered with an Email and Password.");
		} else {
			message.error(errorMessage || "GitHub login error, user is registered");
		}

		throw err;
	}
};

export const getUserData = async (uid: string) => {
  const res = await callApiCoachConsole("/autenticated-users/read-users", {
    uid
  });
  
  if (res.status == 200) {
    console.log(res.user);
    return res.user;
  }
};

// Export functions
export {
	auth,
	db,
	loginWithGoogle,
	loginWithGitHub,
	storage,
	langDp,
	examDb
};