import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

export interface WishlistItem {
  pluginId: string;
  name: string;
  author: string;
  previewImage?: string;
  category?: string;
  folderId: string; // 'default' or folder ID
  downloaded: boolean;
  addedAt: Date | null;
}

export interface WishlistFolder {
  id: string;
  name: string;
  createdAt: Date | null;
}

// Subscribe to items
export function subscribeWishlist(
  uid: string,
  callback: (items: WishlistItem[]) => void
) {
  const ref = collection(db, 'users', uid, 'wishlist');
  const q = query(ref, orderBy('addedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const items: WishlistItem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          pluginId: d.id,
          name: data.name || '',
          author: data.author || '',
          previewImage: data.previewImage || '',
          category: data.category || '',
          folderId: data.folderId || 'default',
          downloaded: !!data.downloaded,
          addedAt: data.addedAt?.toDate?.() ?? null,
        };
      });
      callback(items);
    },
    (err) => {
      console.warn('Firestore wishlist error:', err.message);
      callback([]);
    }
  );
}

// Subscribe to custom folders
export function subscribeFolders(
  uid: string,
  callback: (folders: WishlistFolder[]) => void
) {
  const ref = collection(db, 'users', uid, 'folders');
  const q = query(ref, orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const folders: WishlistFolder[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || 'Folder Baru',
          createdAt: data.createdAt?.toDate?.() ?? null,
        };
      });
      callback(folders);
    },
    (err) => {
      console.warn('Firestore folders error:', err.message);
      callback([]);
    }
  );
}

export async function createFolder(uid: string, folderName: string) {
  const folderRef = doc(collection(db, 'users', uid, 'folders'));
  await setDoc(folderRef, {
    name: folderName,
    createdAt: serverTimestamp(),
  });
  return folderRef.id;
}

export async function deleteFolder(uid: string, folderId: string) {
  try {
    // 1. Delete all wishlist items inside this folder
    const wishlistRef = collection(db, 'users', uid, 'wishlist');
    const q = query(wishlistRef, where('folderId', '==', folderId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }
  } catch (err) {
    console.error('Error deleting items in folder:', err);
  }

  // 2. Delete the folder doc
  await deleteDoc(doc(db, 'users', uid, 'folders', folderId));
}

export async function addToWishlist(
  uid: string,
  plugin: { id: string; name: string; author: string; previewImage?: string; category?: string },
  folderId = 'default'
) {
  await setDoc(
    doc(db, 'users', uid, 'wishlist', plugin.id),
    {
      pluginId: plugin.id,
      name: plugin.name,
      author: plugin.author,
      previewImage: plugin.previewImage || '',
      category: plugin.category || '',
      folderId,
      downloaded: false,
      addedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function removeFromWishlist(uid: string, pluginId: string) {
  await deleteDoc(doc(db, 'users', uid, 'wishlist', pluginId));
}

export async function toggleDownloadedStatus(uid: string, pluginId: string, currentStatus: boolean) {
  await updateDoc(doc(db, 'users', uid, 'wishlist', pluginId), {
    downloaded: !currentStatus,
  });
}

export async function moveWishlistItem(uid: string, pluginId: string, targetFolderId: string) {
  await updateDoc(doc(db, 'users', uid, 'wishlist', pluginId), {
    folderId: targetFolderId,
  });
}
