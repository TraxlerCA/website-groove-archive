'use client';

import { toPng } from 'html-to-image';

const EXPORT_PIXEL_RATIO = 3;

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
