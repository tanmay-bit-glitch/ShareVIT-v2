import { NextResponse } from 'next/server';
import { sendOrderNotificationEmail } from '@/lib/mail';

function getAdminDb() {
  const { initializeApp: initClientApp, getApps: getClientApps } = require('firebase/app');
  const { getFirestore: getClientFirestore, doc, getDoc } = require('firebase/firestore');

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  };

  const app = getClientApps().length === 0 ? initClientApp(firebaseConfig) : getClientApps()[0];
  return { db: getClientFirestore(app), doc, getDoc };
}

export async function POST(request) {
  try {
    const { buyerName, buyerPhone, sellers } = await request.json();
    
    if (!sellers || !Array.isArray(sellers) || sellers.length === 0) {
      return NextResponse.json({ error: 'Sellers list is required' }, { status: 400 });
    }

    const { db, doc, getDoc } = getAdminDb();
    
    // We expect sellers to be an array of objects:
    // { sellerId: 'uid123', sellerName: 'John', items: [{title: 'Item1', price: 50}] }

    // Send emails to all sellers
    const emailPromises = sellers.map(async (seller) => {
      try {
        // Fetch seller email from firestore users collection
        const userDoc = await getDoc(doc(db, 'users', seller.sellerId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const sellerEmail = userData.email;
          
          if (sellerEmail) {
            await sendOrderNotificationEmail(
              sellerEmail, 
              seller.sellerName || userData.displayName || 'Seller', 
              buyerName || 'A Student', 
              buyerPhone,
              seller.items
            );
          }
        }
      } catch (err) {
        console.error(`Failed to send email to seller ${seller.sellerId}`, err);
      }
    });

    await Promise.all(emailPromises);

    return NextResponse.json({ message: 'Order notifications sent successfully' });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to process checkout' }, { status: 500 });
  }
}
