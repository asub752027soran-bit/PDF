import JSZip from 'jszip';

export async function createZipArchive(
  files: { name: string; data: Uint8Array | Blob | string }[]
): Promise<Blob> {
  const zip = new JSZip();

  for (const item of files) {
    zip.file(item.name, item.data);
  }

  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
