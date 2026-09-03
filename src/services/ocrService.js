// Image OCR Text Extraction Service

export async function extractTextFromImage(file, onProgress) {
  if (!file) {
    throw new Error('No image file provided.');
  }

  // Validate image file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Unsupported image type. Please upload JPG, PNG, or WEBP images.');
  }

  try {
    const Tesseract = await import('tesseract.js');
    const result = await Tesseract.recognize(file, 'eng', {
      logger: (m) => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    const text = result.data.text.trim();
    if (!text) {
      throw new Error('No readable text found in the uploaded image.');
    }
    return text;
  } catch (err) {
    console.error('Tesseract OCR error:', err);
    throw new Error(err.message || 'Failed to extract text from image. Please try a clearer image.');
  }
}
