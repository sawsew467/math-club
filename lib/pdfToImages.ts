/**
 * Convert PDF file to array of base64 images (one per page)
 * Uses PDF.js to render each page to canvas
 * IMPORTANT: This function MUST only run in browser (client-side)
 */

export interface PDFPageImage {
  pageNumber: number;
  base64: string;
  width: number;
  height: number;
}

export async function convertPDFToImages(
  file: File,
  options: {
    scale?: number;
    maxPages?: number;
  } = {}
): Promise<PDFPageImage[]> {
  // Ensure we're in browser
  if (typeof window === 'undefined') {
    throw new Error('convertPDFToImages can only run in browser');
  }

  const { scale = 2, maxPages = 10 } = options;

  try {
    // Dynamic import PDF.js only in browser
    const pdfjsLib = await import('pdfjs-dist');

    // Configure worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const numPages = Math.min(pdf.numPages, maxPages);
    const images: PDFPageImage[] = [];

    // Convert each page to image
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render PDF page to canvas
      // @ts-expect-error pdfjs types mismatch, but this works at runtime
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Convert canvas to base64 (JPEG for smaller size)
      const base64 = canvas.toDataURL('image/jpeg', 0.95);

      images.push({
        pageNumber: pageNum,
        base64,
        width: viewport.width,
        height: viewport.height,
      });
    }

    return images;
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    throw new Error('Không thể chuyển đổi PDF thành hình ảnh. Vui lòng thử file PDF khác.');
  }
}

/**
 * Get estimated size of images in MB
 */
export function estimateImagesSize(images: PDFPageImage[]): number {
  const totalBase64Length = images.reduce((sum, img) => sum + img.base64.length, 0);
  // Base64 encoding increases size by ~33%
  return (totalBase64Length * 0.75) / (1024 * 1024);
}
