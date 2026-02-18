import axios from "axios";
import { getAuth } from "firebase/auth";

const instance = axios.create({
  baseURL: "https://circle-experience.up.railway.app/api",
});

// Token əlavə et və localStorage-də saxla
instance.interceptors.request.use(
  async (config) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken(true); // true → yenilənmiş token al
      config.headers.Authorization = `Bearer ${token}`;
      
      // ✅ localStorage-ə yaz
      localStorage.setItem("token", token);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 401 olarsa login-ə qaytarmırıq, sadəcə error atırıq
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("401 Unauthorized – token outdated or invalid");

      // Burda redirect ya logout yoxdur
    }

    return Promise.reject(error);
  }
);

export default instance;