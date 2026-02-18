// src/utils/getValidToken.ts
import { auth } from "../config/firebase";

export const getValidToken = async (): Promise<string | null> => {
  const user = auth.currentUser;

  if (!user) return null;

  try {
    const token = await user.getIdToken(true);
    return token;
  } catch (err) {
    console.error("Token almaqda xəta:", err);
    return null;
  }
};
