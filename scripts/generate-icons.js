import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);

  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generateIcon(width, height, isMaskable = false) {
  const rowBytes = width * 4 + 1; // 1 filter byte per row
  const rawData = Buffer.alloc(height * rowBytes);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) / 2;
  const safeR = isMaskable ? maxR * 0.75 : maxR * 0.88;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Coordinate from center
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep dark sleek background (#070a13 to #0f172a gradient)
      const gradT = (x + y) / (width + height);
      let r = Math.round(7 + gradT * 8);
      let g = Math.round(10 + gradT * 13);
      let b = Math.round(19 + gradT * 23);
      let a = 255;

      // Draw rounded squircle TV card
      const cardHalfW = safeR * 0.95;
      const cardHalfH = safeR * 0.65;
      const cardCorner = safeR * 0.2;

      const qx = Math.max(Math.abs(dx) - (cardHalfW - cardCorner), 0);
      const qy = Math.max(Math.abs(dy + safeR * 0.05) - (cardHalfH - cardCorner), 0);
      const cardDist = Math.sqrt(qx * qx + qy * qy);

      if (cardDist <= cardCorner) {
        // Inside TV chassis: vivid Blue/Indigo gradient
        const tvGrad = (x - (cx - cardHalfW)) / (cardHalfW * 2);
        r = Math.round(29 + tvGrad * 30);
        g = Math.round(78 + tvGrad * 52);
        b = Math.round(216 + tvGrad * 30);

        // Screen bezel (inner screen)
        const screenHalfW = cardHalfW * 0.86;
        const screenHalfH = cardHalfH * 0.78;
        const sqx = Math.max(Math.abs(dx) - (screenHalfW - 12), 0);
        const sqy = Math.max(Math.abs(dy + safeR * 0.05) - (screenHalfH - 12), 0);
        const screenDist = Math.sqrt(sqx * sqx + sqy * sqy);

        if (screenDist <= 12) {
          // Inside Screen: dark cyber blue
          r = 15;
          g = 23;
          b = 42;

          // Play triangle symbol in center
          const pLeft = cx - safeR * 0.15;
          const pRight = cx + safeR * 0.22;
          const pTop = cy + safeR * 0.05 - safeR * 0.2;
          const pBottom = cy + safeR * 0.05 + safeR * 0.2;

          if (x >= pLeft && x <= pRight) {
            const progress = (x - pLeft) / (pRight - pLeft);
            const currentHalfSpan = (pBottom - pTop) * 0.5 * (1 - progress);
            const midY = (pTop + pBottom) / 2;
            if (y >= midY - currentHalfSpan && y <= midY + currentHalfSpan) {
              // Neon Cyan Play arrow
              r = 56;
              g = 189;
              b = 248;
            }
          }

          // Live red recording badge at top right of screen
          const badgeX = cx + screenHalfW - safeR * 0.15;
          const badgeY = cy + safeR * 0.05 - screenHalfH + safeR * 0.15;
          const badgeDist = Math.sqrt((x - badgeX) * (x - badgeX) + (y - badgeY) * (y - badgeY));
          if (badgeDist <= safeR * 0.08) {
            r = 239;
            g = 68;
            b = 68;
          }
        }
      }

      // TV Antenna lines
      const antY = cy - cardHalfH + safeR * 0.05;
      if (y < antY && y >= antY - safeR * 0.4) {
        const leftAntTargetX = cx - safeR * 0.4;
        const rightAntTargetX = cx + safeR * 0.4;
        const antProgress = (antY - y) / (safeR * 0.4);

        const leftExpectedX = cx - (cx - leftAntTargetX) * antProgress;
        const rightExpectedX = cx + (rightAntTargetX - cx) * antProgress;

        if (Math.abs(x - leftExpectedX) <= Math.max(2, width * 0.012) ||
            Math.abs(x - rightExpectedX) <= Math.max(2, width * 0.012)) {
          r = 56;
          g = 189;
          b = 248;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Compress
  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const pubDir = path.resolve('public');
if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), generateIcon(192, 192, false));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), generateIcon(512, 512, false));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), generateIcon(512, 512, true));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), generateIcon(180, 180, false));

console.log('PWA PNG icons generated successfully!');
