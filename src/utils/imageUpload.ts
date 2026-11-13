export interface ImageCompressionOptions {
  maxWidth: number;
  maxDataUrlLength?: number;
}

/**
 * Compresses a local image File into a JPEG data URL sized safely under Firestore's
 * 400,000-character document field limit declared in firebase-blueprint.json.
 */
export async function compressImageFileToDataUrl(
  file: File,
  options: ImageCompressionOptions
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (PNG, JPEG, or WebP).');
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Image file is larger than 15MB. Please pick a smaller image.');
  }

  const maxChars = options.maxDataUrlLength ?? 340_000;

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Could not decode selected image file.'));
    el.src = rawDataUrl;
  });

  const scale = img.width > options.maxWidth ? options.maxWidth / img.width : 1;
  const targetWidth = Math.max(1, Math.round(img.width * scale));
  const targetHeight = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser canvas context unavailable for image compression.');
  }
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const qualities = [0.84, 0.72, 0.58, 0.45];
  for (const q of qualities) {
    const encoded = canvas.toDataURL('image/jpeg', q);
    if (encoded.length <= maxChars) {
      return encoded;
    }
  }

  // Fallback tighter resize if image is extremely detailed
  const smallerCanvas = document.createElement('canvas');
  smallerCanvas.width = Math.max(1, Math.round(targetWidth * 0.65));
  smallerCanvas.height = Math.max(1, Math.round(targetHeight * 0.65));
  const smallCtx = smallerCanvas.getContext('2d');
  if (smallCtx) {
    smallCtx.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
    const smallerEncoded = smallerCanvas.toDataURL('image/jpeg', 0.6);
    if (smallerEncoded.length <= maxChars) {
      return smallerEncoded;
    }
  }

  throw new Error('Compressed image still exceeds storage size limits. Please use a smaller image or URL.');
}
