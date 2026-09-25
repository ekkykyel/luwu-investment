import jsPDF from 'jspdf';
import { safeHtml2Canvas } from '../lib/html2canvasShim';

export interface BapPdfOptions {
  filename?: string;
  onStart?: () => void;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

/**
 * Utility to export official BAP documents (Lembar 1 & Lembar 2) directly into high-res A4 PDF file using jsPDF & html2canvas.
 * Handles full CSS styling, official seals, typography, and MapLibre canvas delineation layers.
 */
export async function generateBapPdfFromElement(
  elementOrId: HTMLElement | string,
  options?: BapPdfOptions
): Promise<void> {
  const { filename = 'BAP-Resmi-Kabupaten-Luwu.pdf', onStart, onSuccess, onError } = options || {};

  try {
    if (onStart) onStart();

    let element: HTMLElement | null = null;
    if (typeof elementOrId === 'string') {
      element = document.getElementById(elementOrId);
    } else {
      element = elementOrId;
    }

    if (!element) {
      throw new Error(`Element target BAP dengan ID '${elementOrId}' tidak ditemukan.`);
    }

    // Ensure web fonts are ready before rasterizing
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Create an offscreen wrapper mounted to document.body
    // Isolates the document from scrollbars, modal scale transforms, and screen width variations
    const offscreenContainer = document.createElement("div");
    offscreenContainer.style.position = "fixed";
    offscreenContainer.style.left = "-9999px";
    offscreenContainer.style.top = "0";
    offscreenContainer.style.width = "210mm";
    offscreenContainer.style.zIndex = "-9999";
    offscreenContainer.style.backgroundColor = "#ffffff";
    document.body.appendChild(offscreenContainer);

    // Clone element into pristine offscreen container
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.margin = "0";
    clonedElement.style.boxShadow = "none";
    clonedElement.style.transform = "none";
    clonedElement.style.width = "210mm";
    offscreenContainer.appendChild(clonedElement);

    // Render HTML container to high-resolution canvas with locked 210mm width (794px at 96dpi)
    const canvas = await safeHtml2Canvas(clonedElement, {
      scale: 3, // 300 DPI high clarity
      useCORS: true, // Allow cross-origin images/tiles
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,  // Exact 210mm width in px
      windowHeight: 1123, // Exact 297mm height in px
      scrollX: 0,
      scrollY: 0
    });

    document.body.removeChild(offscreenContainer);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Initialize A4 Portrait jsPDF (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    const imgProps = pdf.getImageProperties(imgData);
    const contentHeightMm = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeftMm = contentHeightMm;
    let positionMm = 0;

    // First Page
    pdf.addImage(imgData, 'JPEG', 0, positionMm, pdfWidth, contentHeightMm);
    heightLeftMm -= pdfHeight;

    // Multi-page loop if document spans over 1 page (e.g. Lembar 2 Peta Spasial)
    while (heightLeftMm > 20) {
      positionMm = heightLeftMm - contentHeightMm;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, positionMm, pdfWidth, contentHeightMm);
      heightLeftMm -= pdfHeight;
    }

    // Save generated PDF
    pdf.save(filename);

    if (onSuccess) onSuccess();
  } catch (err) {
    console.error('BAP PDF Generation Error:', err);
    if (onError) onError(err);
    else throw err;
  }
}
