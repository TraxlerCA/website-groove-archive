'use client';

import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

const EXPORT_PIXEL_RATIO = 3;
const PDF_MARGIN = 24;

async function waitForFonts() {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return;
  }

  try {
    await document.fonts.ready;
  } catch {
    // Ignore font loading failures and export with whatever is available.
  }
}

async function renderNodeToPng(node: HTMLElement) {
  await waitForFonts();

  return toPng(node, {
    pixelRatio: EXPORT_PIXEL_RATIO,
    backgroundColor: '#ffffff',
    cacheBust: true,
    skipFonts: false,
  });
}

async function dataUrlToBlob(dataUrl: string) {
  const response = await fetch(dataUrl);
  return response.blob();
}

function triggerDownload(url: string, fileName: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
}

export async function exportHeatmapPng(node: HTMLElement, fileName: string) {
  const dataUrl = await renderNodeToPng(node);
  const blob = await dataUrlToBlob(dataUrl);
  const objectUrl = URL.createObjectURL(blob);

  try {
    triggerDownload(objectUrl, fileName);
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  return dataUrl;
}

export async function exportHeatmapPdf(node: HTMLElement, fileName: string) {
  const dataUrl = await renderNodeToPng(node);

  const image = new Image();
  image.src = dataUrl;
  await image.decode();

  const orientation = image.width > image.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const innerWidth = pageWidth - PDF_MARGIN * 2;
  const innerHeight = pageHeight - PDF_MARGIN * 2;
  const renderWidth = innerWidth;
  const renderHeight = image.height * (renderWidth / image.width);

  let yOffset = 0;
  let firstPage = true;

  while (yOffset < renderHeight) {
    if (!firstPage) {
      pdf.addPage();
    }

    pdf.addImage(
      dataUrl,
      'PNG',
      PDF_MARGIN,
      PDF_MARGIN - yOffset,
      renderWidth,
      renderHeight,
      undefined,
      'FAST',
    );

    yOffset += innerHeight;
    firstPage = false;
  }

  pdf.save(fileName);
}
