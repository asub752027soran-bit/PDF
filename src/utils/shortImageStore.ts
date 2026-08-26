/**
 * Short Image URL Storage & Public Link Generator
 * Powered by IndexedDB + LocalStorage with Multi-Provider Public Cloud Upload Fallback
 */

export interface StoredShortImage {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  width: number;
  height: number;
  size: number;
  createdAt: number;
  customSlug?: string;
  publicCloudUrl?: string;
}

const STORAGE_KEY = 'pdfeditfy_short_images';
const DB_NAME = 'pdfeditfy_images_v2';
const STORE_NAME = 'images';

// Open IndexedDB safely
function openImageDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('customSlug', 'customSlug', { unique: false });
      }
    };
    req.onsuccess = (e: any) => resolve(e.target.result);
    req.onerror = (e: any) => reject(e.target.error);
  });
}

/**
 * Save short image into Server API, IndexedDB, and LocalStorage
 */
export async function saveShortImageAsync(item: Omit<StoredShortImage, 'createdAt'>): Promise<StoredShortImage> {
  const fullItem: StoredShortImage = {
    ...item,
    createdAt: Date.now(),
  };

  // 1. Sync to Server API for universal cross-device / cross-user short URL access
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch('/api/short', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullItem)
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.publicCloudUrl) {
          fullItem.publicCloudUrl = json.publicCloudUrl;
        }
      }
    }
  } catch (err) {
    console.debug('Server short image sync note (client-side offline fallback):', err);
  }

  // 2. Save to IndexedDB (No 5MB storage limit)
  try {
    const db = await openImageDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(fullItem);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.debug('IndexedDB save note:', err);
  }

  // 3. Try saving metadata + small image to localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '[]';
    const list: StoredShortImage[] = JSON.parse(raw);
    const filtered = list.filter((i) => i.id !== item.id && (!item.customSlug || i.customSlug !== item.customSlug));
    filtered.unshift(fullItem);
    // Limit to 20 items to prevent LocalStorage QuotaExceededError
    const trimmed = filtered.slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    // If quota exceeded, save without dataUrl in localStorage (full dataUrl resides in IndexedDB and server)
    try {
      const miniItem = { ...fullItem, dataUrl: fullItem.dataUrl.length > 50000 ? '' : fullItem.dataUrl };
      const raw = localStorage.getItem(STORAGE_KEY) || '[]';
      const list: StoredShortImage[] = JSON.parse(raw);
      const filtered = list.filter((i) => i.id !== item.id);
      filtered.unshift(miniItem);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 10)));
    } catch {
      // ignore
    }
  }

  return fullItem;
}

export function saveShortImage(item: Omit<StoredShortImage, 'createdAt'>): StoredShortImage {
  const fullItem: StoredShortImage = {
    ...item,
    createdAt: Date.now(),
  };

  // Fire async IndexedDB and server save in background
  saveShortImageAsync(item).catch(() => {});

  return fullItem;
}

/**
 * Retrieve short image by ID or custom Slug (Server -> IndexedDB -> LocalStorage)
 */
export async function getShortImageAsync(idOrSlug: string): Promise<StoredShortImage | null> {
  const cleanKey = decodeURIComponent(idOrSlug).trim();
  if (!cleanKey) return null;

  // 1. Try Server API first (enables universal sharing across devices and browsers)
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch(`/api/short/${encodeURIComponent(cleanKey)}`);
      if (res.ok) {
        const item: StoredShortImage = await res.json();
        if (item && item.dataUrl) {
          // Cache in IndexedDB for offline access
          try {
            const db = await openImageDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(item);
          } catch {
            // ignore cache error
          }
          return item;
        }
      }
    }
  } catch (err) {
    console.debug('Server API lookup note:', err);
  }

  // 2. Try IndexedDB
  try {
    const db = await openImageDB();
    const result = await new Promise<StoredShortImage | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(cleanKey);
      getReq.onsuccess = () => {
        if (getReq.result) {
          resolve(getReq.result);
          return;
        }
        // Try query by customSlug index
        try {
          const index = store.index('customSlug');
          const slugReq = index.get(cleanKey);
          slugReq.onsuccess = () => resolve(slugReq.result || null);
          slugReq.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      };
      getReq.onerror = () => resolve(null);
    });

    if (result && result.dataUrl) {
      return result;
    }
  } catch (err) {
    console.debug('IndexedDB lookup note:', err);
  }

  // 3. Try LocalStorage fallback
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '[]';
    const list: StoredShortImage[] = JSON.parse(raw);
    const found = list.find((i) => i.id === cleanKey || i.customSlug === cleanKey);
    if (found && found.dataUrl) return found;
  } catch {
    // ignore
  }

  return null;
}

export function getShortImage(idOrSlug: string): StoredShortImage | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '[]';
    const list: StoredShortImage[] = JSON.parse(raw);
    const found = list.find((i) => i.id === idOrSlug || i.customSlug === idOrSlug);
    return found || null;
  } catch {
    return null;
  }
}

/**
 * Generate clean short URL string for the web application
 */
export function buildLocalShortUrl(idOrSlug: string): string {
  if (typeof window === 'undefined') return `https://pdfeditfy.com/tool/image-to-url?img=${encodeURIComponent(idOrSlug)}`;
  const origin = window.location.origin;
  return `${origin}/tool/image-to-url?img=${encodeURIComponent(idOrSlug)}`;
}

/**
 * Generate direct raw image binary URL
 */
export function buildRawImageUrl(idOrSlug: string): string {
  if (typeof window === 'undefined') return `https://pdfeditfy.com/api/short/raw/${encodeURIComponent(idOrSlug)}`;
  const origin = window.location.origin;
  return `${origin}/api/short/raw/${encodeURIComponent(idOrSlug)}`;
}

/**
 * Convert Data URL to Blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/png';
  const raw = window.atob(parts[1] || '');
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Upload image to Free Public Web Hosting APIs with multiple failover providers
 */
export async function uploadToPublicCloud(
  dataUrl: string,
  filename: string = 'image.png'
): Promise<{ url: string; deleteUrl?: string }> {
  const blob = dataUrlToBlob(dataUrl);
  const base64Data = dataUrl.split(',')[1] || dataUrl;

  // Provider 1: ImgBB Public Upload API
  try {
    const formData = new FormData();
    formData.append('image', base64Data);
    const res = await fetch('https://api.imgbb.com/1/upload?key=8cf5bafe1d6a0a030095810bbfad4720', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.data && (json.data.url || json.data.display_url)) {
        return {
          url: json.data.display_url || json.data.url,
          deleteUrl: json.data.delete_url,
        };
      }
    }
  } catch (e) {
    console.debug('ImgBB upload attempt:', e);
  }

  // Provider 2: FreeImage.host API
  try {
    const formData = new FormData();
    formData.append('key', '6d207e02198a847aa98d0a2a901485a5');
    formData.append('action', 'upload');
    formData.append('source', base64Data);
    formData.append('format', 'json');

    const res = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.image && data.image.url) {
        return {
          url: data.image.url,
          deleteUrl: data.image.delete_url,
        };
      }
    }
  } catch (e) {
    console.debug('FreeImage.host upload attempt:', e);
  }

  // Provider 3: Litterbox / Catbox temporary 72-hour fast cloud host
  try {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('time', '72h');
    formData.append('fileToUpload', blob, filename);

    const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const textUrl = (await res.text()).trim();
      if (textUrl.startsWith('http://') || textUrl.startsWith('https://')) {
        return { url: textUrl };
      }
    }
  } catch (e) {
    console.debug('Litterbox upload attempt:', e);
  }

  // Fallback: Local short URL
  const slug = `img_${Math.random().toString(36).substring(2, 8)}`;
  return {
    url: buildLocalShortUrl(slug),
  };
}
