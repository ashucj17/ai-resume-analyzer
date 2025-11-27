export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any = null;
let loading: Promise<any> | null = null;

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  if (loading) return loading;

  loading = import("pdfjs-dist").then((lib) => {
    // Use the worker from the npm package instead of a static file
    pdfjsLib = lib;
    
    // Option 1: Use CDN worker (easiest)
    lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${lib.version}/pdf.worker.min.mjs`;
    
    // Option 2: Use local worker from node_modules
    // lib.GlobalWorkerOptions.workerSrc = new URL(
    //   'pdfjs-dist/build/pdf.worker.min.mjs',
    //   import.meta.url
    // ).toString();
    
    return lib;
  }).catch((err) => { 
    loading = null; 
    throw err; 
  });

  return loading;
}

export async function convertPdfToImage(file: File): Promise<PdfConversionResult> {
  try {
    const lib = await loadPdfJs();
    const buffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: buffer }).promise;
    const page = await pdf.getPage(1);

    const scale = 2;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");

    await page.render({ canvasContext: ctx, viewport }).promise;

    return await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve({ imageUrl: "", file: null, error: "Failed to create blob" });
        const name = file.name.replace(/\.pdf$/i, "") + ".png";
        const imageFile = new File([blob], name, { type: "image/png" });
        const url = URL.createObjectURL(blob);
        resolve({ imageUrl: url, file: imageFile });
      }, "image/png", 0.9);
    });
  } catch (err) {
    return { imageUrl: "", file: null, error: String(err) };
  }
}