/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import QRCode from 'qrcode';

/**
 * Generates a Base64 PNG Data URL for a given string of text.
 * Suitable for embedding in <img> elements.
 */
export async function generateQrCode(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 2,
      width: 300,
      color: {
        dark: '#1e293b', // Tailwind slate-800
        light: '#ffffff', // White
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('QR Code generation failed:', err);
    return '';
  }
}
