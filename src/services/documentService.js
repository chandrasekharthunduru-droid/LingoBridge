// Document Text Parsing Service (TXT, PDF, DOCX)

export async function parseDocumentFile(file) {
  if (!file) {
    throw new Error('No document file selected.');
  }

  // File size validation (10 MB max)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('File exceeds the maximum limit of 10 MB. Please upload a smaller document.');
  }

  const fileName = file.name.toLowerCase();

  // 1. Plain Text (.txt)
  if (fileName.endsWith('.txt')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result.trim());
      reader.onerror = () => reject(new Error('Failed to read text file.'));
      reader.readAsText(file);
    });
  }

  // 2. DOCX (.docx)
  if (fileName.endsWith('.docx')) {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value.trim();
      if (!text) throw new Error('No text content found in DOCX file.');
      return text;
    } catch (err) {
      console.error('DOCX parsing error:', err);
      throw new Error('Failed to parse DOCX file. Make sure it is a valid Word document.');
    }
  }

  // 3. PDF (.pdf)
  if (fileName.endsWith('.pdf')) {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let extractedText = '';
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ');
        extractedText += pageText + '\n';
      }

      const text = extractedText.trim();
      if (!text) throw new Error('No readable text found in PDF document.');
      return text;
    } catch (err) {
      console.error('PDF parsing error:', err);
      // Fallback text reader if pdfjs worker fails
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const raw = e.target.result;
          const cleanText = raw.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleanText.length > 20) {
            resolve(cleanText);
          } else {
            reject(new Error('Unable to extract text from PDF. Please check if the file is scanned or encrypted.'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read PDF file.'));
        reader.readAsText(file);
      });
    }
  }

  throw new Error('Unsupported document format. Please upload a .txt, .pdf, or .docx file.');
}
