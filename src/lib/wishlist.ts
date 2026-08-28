import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

export interface WishlistItem {
  pluginId: string;
  name: string;
  author: string;
  addedAt: Date | null;
}

export function subscribeWishlist(
  uid: string,
  callback: (items: WishlistItem[]) => void
) {
  const ref = collection(db, 'users', uid, 'wishlist');
  const q = query(ref, orderBy('addedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const items: WishlistItem[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        pluginId: d.id,
        name: data.name,
        author: data.author,
        addedAt: data.addedAt?.toDate?.() ?? null,
      };
    });
    callback(items);
  });
}

export async function addToWishlist(
  uid: string,
  plugin: { id: string; name: string; author: string }
) {
  await setDoc(doc(db, 'users', uid, 'wishlist', plugin.id), {
    pluginId: plugin.id,
    name: plugin.name,
    author: plugin.author,
    addedAt: serverTimestamp(),
  });
}

export async function removeFromWishlist(uid: string, pluginId: string) {
  await deleteDoc(doc(db, 'users', uid, 'wishlist', pluginId));
}
