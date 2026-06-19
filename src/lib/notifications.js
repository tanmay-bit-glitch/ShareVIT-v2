import { collection, addDoc, serverTimestamp, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';

export const NOTIFICATION_CATEGORIES = [
  'Academic',
  'Marketplace',
  'Community',
  'Events',
  'AI Assistant',
  'System'
];

/**
 * Creates a notification for a single user
 */
export const createNotification = async (userId, title, message, category, metadata = {}) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      category,
      metadata,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

/**
 * Creates notifications for a group of users matching specific criteria.
 * Filters: { campus, department, year }
 */
export const notifyGroup = async (title, message, category, filters = {}, metadata = {}, senderId = null) => {
  try {
    let q = collection(db, 'users');
    
    // Build query based on provided filters
    const queryConstraints = [];
    if (filters.campus) queryConstraints.push(where('campus', '==', filters.campus));
    if (filters.department) queryConstraints.push(where('department', '==', filters.department));
    if (filters.year) queryConstraints.push(where('year', '==', filters.year));

    if (queryConstraints.length > 0) {
      q = query(q, ...queryConstraints);
    }

    const usersSnap = await getDocs(q);
    
    // Batch write to create notifications efficiently
    const batch = writeBatch(db);
    let count = 0;

    usersSnap.forEach((userDoc) => {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Don't notify the sender themselves
      if (userId === senderId) return;

      // Check user preferences
      const mutedCategories = userData.notificationPreferences?.mutedCategories || [];
      const globalMute = userData.notificationPreferences?.globalMute || false;

      if (globalMute) return;
      if (mutedCategories.includes(category)) return;

      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        userId,
        title,
        message,
        category,
        metadata,
        read: false,
        createdAt: serverTimestamp()
      });

      count++;
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Dispatched ${count} notifications`);
    }
  } catch (error) {
    console.error("Error notifying group:", error);
  }
};
