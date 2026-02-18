import { auth, loginWithGitHub, loginWithGoogle } from '@/config/firebase';
import { callApi, callApiWithGetToken } from '@/utils/callApi';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { signInWithEmailAndPassword } from "firebase/auth";

// ✅ New helper function to redirect after login



export default function canvas_login_actions() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();

      const res: any = await callApi("/auth/login", { email, password });

      if (res.status === 200) {
        localStorage.setItem("token", idToken);
        localStorage.setItem("userData", JSON.stringify(res.user));
        toast.success(res.message);
            window.location.href = '/dashboard';
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Login error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const user: any = await loginWithGoogle();
    if (user.token) {
      localStorage.setItem('token', user.token);
      localStorage.setItem('userData', JSON.stringify(user.user));
      toast.success('User signed in');
         window.location.href = '/dashboard';
    } else {
      toast.error('User signed in, but no access token');
    }
  };

  const handleGitHubLogin = async () => {
    const user: any = await loginWithGitHub();
    if (user.token) {
      localStorage.setItem('token', user.token);
      localStorage.setItem('userData', JSON.stringify(user.user));
      toast.success('User signed in');
          window.location.href = '/dashboard';
    } else {
      toast.error('User signed in, but no access token');
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isSubmitting,
    setIsSubmitting,
    handleSubmit,
    handleGoogleSignIn,
    handleGitHubLogin,
  };
}
