/**
 * Short Image URL Storage & Public Link Generator
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

export function saveShortImage(item: Omit<StoredShortImage, 'createdAt'>): StoredShortImage {
  const fullItem: StoredShortImage = {
    ...item,
    createdAt: Date.now(),
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '[]';
    const list: StoredShortImage[] = JSON.parse(raw);
    // Keep max 30 recent short images to prevent quota overflow
    const filtered = list.filter((i) => i.id !== item.id && (!item.customSlug || i.customSlug !== item.customSlug));
    filtered.unshift(fullItem);
    const trimmed = filtered.slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.debug('LocalStorage error in saveShortImage:', err);
  }

  return fullItem;
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
 * Generate clean short URL string for local app
 */
export function buildLocalShortUrl(idOrSlug: string): string {
  const origin = window.location.origin || 'https://pdfeditfy.com';
  return `${origin}/tool/image-to-url?img=${encodeURIComponent(idOrSlug)}`;
}

/**
 * Upload image to Free Public Web Hosting API (freeimage.host / imgbb / fallback)
 */
export async function uploadToPublicCloud(dataUrl: string, filename: string): Promise<{ url: string; deleteUrl?: string }> {
  // Extract base64 without header
  const base64Data = dataUrl.split(',')[1] || dataUrl;

  try {
    // 1. Try FreeImage.host client API
    const formData = new FormData();
    formData.append('key', '6d207e02198a847aa98d0a2a901485a5'); // Public community API key
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
    console.debug('FreeImage.host attempt skipped, trying fallback:', e);
  }

  try {
    // 2. Try ImgBB free upload API fallback
    const formData = new FormData();
    formData.append('image', base64Data);
    const res = await fetch('https://api.imgbb.com/1/upload?key=8cf5bafe1d6a0a030095810bbfad4720', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.data && data.data.url) {
        return {
          url: data.data.url,
          deleteUrl: data.data.delete_url,
        };
      }
    }
  } catch (e) {
    console.debug('ImgBB attempt skipped:', e);
  }

  // 3. If remote API is offline or blocked by CORS, return the local app short viewer link
  const cleanId = `img_${Math.random().toString(36).substring(2, 8)}`;
  return {
    url: buildLocalShortUrl(cleanId),
  };
}
