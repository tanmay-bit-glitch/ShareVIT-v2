import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { createNotification } from './notifications';

export const addToCart = async (userId, product, quantity = 1) => {
  try {
    // Prevent duplicates
    const q = query(
      collection(db, 'cart_items'),
      where('userId', '==', userId),
      where('productId', '==', product.id)
    );
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      return { success: false, message: 'Item is already in your cart' };
    }

    await addDoc(collection(db, 'cart_items'), {
      userId,
      productId: product.id,
      quantity,
      createdAt: serverTimestamp()
    });

    // Notify Buyer
    await createNotification(
      userId,
      `Added to Cart`,
      `You added ${product.title} to your cart.`,
      'System',
      { productId: product.id }
    );

    // Notify Seller
    if (product.sellerId && product.sellerId !== userId) {
      await createNotification(
        product.sellerId,
        `Item Added to Cart`,
        `A student added your ${product.title} listing to their cart!`,
        'Marketplace',
        { productId: product.id, type: 'cart_add' }
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error adding to cart:", error);
    return { success: false, message: 'Failed to add item to cart' };
  }
};

export const removeFromCart = async (cartItemId) => {
  try {
    await deleteDoc(doc(db, 'cart_items', cartItemId));
    return { success: true };
  } catch (error) {
    console.error("Error removing from cart:", error);
    return { success: false };
  }
};

export const clearCart = async (userId) => {
  try {
    const q = query(collection(db, 'cart_items'), where('userId', '==', userId));
    const snap = await getDocs(q);
    
    const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
    
    return { success: true };
  } catch (error) {
    console.error("Error clearing cart:", error);
    return { success: false };
  }
};
