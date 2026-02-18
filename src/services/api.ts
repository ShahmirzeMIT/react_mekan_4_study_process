import axios from 'axios';
import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { callApiWithToken } from '@/utils/callApi';

const baseURL = import.meta.env.BASE_URL_COACH_CONSOLE;
export const api = axios.create({
  baseURL: baseURL+'/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Recommendation {
  id: string;
  userId: string;
  name: string;
  role: string;
  feedback: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  disabled: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
  customClaims: any;
  providerData: Array<{
    uid: string;
    displayName?: string;
    email: string;
    photoURL?: string;
    providerId: string;
  }>;
  isActive?: boolean;
}

export interface GetUsersResponse {
  success: boolean;
  users: FirebaseUser[];
  count: number;
  status: number;
}

export const getUsers = async (): Promise<FirebaseUser[]> => {
  try {
    const response = await callApiWithToken('/get-auth/users', {});
    if(response.status==200){

         const users = response.users || [];
    
    // Ensure all users are initially inactive by default
    const usersWithDefaultStatus = users.map(user => ({
      ...user,
      isActive: user.isActive || false // Default to false if not set
    }));
    
    return usersWithDefaultStatus;
    }
 
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
};

export const updateUserStatus = async (userId: string, status: boolean): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const updatedAt = new Date();

    // Update main user profile status
    const userProfileRef = doc(db, 'profile_users', userId, 'profile', 'data');
    
    // First check if the document exists
    const profileDoc = await getDoc(userProfileRef);
    if (profileDoc.exists()) {
      batch.update(userProfileRef, {
        isActive: status,
        updatedAt: updatedAt
      });
    } else {
      // Create the document if it doesn't exist
      batch.set(userProfileRef, {
        isActive: status,
        createdAt: updatedAt,
        updatedAt: updatedAt,
        userId: userId
      });
    }

    // Update all subcollections with status field
    const collections = [
      'education',
      'workExperience', 
      'projects',
      'skills',
      'badges',
      'recommendations',
      'languages',
      'gidCampSteps'
    ];

    for (const collectionName of collections) {
      const subCollectionRef = collection(db, `profile_users/${userId}/${collectionName}`);
      const snapshot = await getDocs(subCollectionRef);
      
      snapshot.docs.forEach((docSnapshot) => {
        const docRef = doc(db, `profile_users/${userId}/${collectionName}`, docSnapshot.id);
        batch.update(docRef, {
          isActive: status,
          updatedAt: updatedAt
        });
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error updating user status:', error);
    throw new Error('Failed to update user status across all collections');
  }
};

export const getUserStatus = async (userId: string): Promise<boolean> => {
  try {
    const userProfileRef = doc(db, 'profile_users', userId, 'profile', 'data');
    const docSnap = await getDoc(userProfileRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.isActive !== false; // Default to false if not set for safety
    }
    
    // If no profile found, create one with inactive status
    const userProfileRefNew = doc(db, 'profile_users', userId, 'profile', 'data');
    await setDoc(userProfileRefNew, {
      isActive: false, // Default to inactive
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userId
    });
    
    return false; // Default to inactive for new users
  } catch (error) {
    console.error('Error getting user status:', error);
    return false; // Default to inactive on error for safety
  }
};

export const bulkUpdateUserStatus = async (userIds: string[], status: boolean): Promise<void> => {
  try {
    const promises = userIds.map(userId => updateUserStatus(userId, status));
    await Promise.all(promises);
  } catch (error) {
    console.error('Error in bulk update:', error);
    throw new Error('Failed to update multiple user statuses');
  }
};

