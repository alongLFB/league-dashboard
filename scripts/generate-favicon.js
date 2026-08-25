const fs = require('fs');
const zlib = require('zlib');

// Create a stylish SVG icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d1117" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="50%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
    <linearGradient id="blue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa" />
      <stop offset="100%" stop-color="#2563eb" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#bg)" stroke="url(#gold)" stroke-width="4" />
  <path d="M64 20 L100 64 L64 108 L28 64 Z" fill="none" stroke="url(#blue)" stroke-width="3" opacity="0.6" filter="url(#glow)" />
  <path d="M48 38 L48 90 L84 90 L84 76 L64 76 L64 38 Z" fill="url(#gold)" filter="url(#glow)" />
</svg>`;

fs.writeFileSync('public/icon.svg', svg);
fs.writeFileSync('app/icon.svg', svg);

// Function to generate a simple uncompressed PNG (32x32)
function createPng32() {
  const width = 32;
  const height = 32;
  
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  
  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    
    // CRC calculation
    let crc = 0xFFFFFFFF;
    for (let i = 4; i < 8 + len; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        if ((crc ^ byte) & 1) {
          crc = (crc >>> 1) ^ 0xEDB88320;
        } else {
          crc = crc >>> 1;
        }
        byte >>>= 1;
      }
    }
    crc = (crc ^ 0xFFFFFFFF) >>> 0;
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }
  
  const ihdrChunk = makeChunk('IHDR', ihdr);
  
  // Image Data: raw RGBA lines
  // Filter byte (0) + 32 * 4 bytes per line
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter byte: none
    for (let x = 0; x < width; x++) {
      const dx = x - 15.5;
      const dy = y - 15.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Hextech blue/gold border circle and "L" shape
      let r = 13, g = 17, b = 23, a = 255; // #0d1117
      
      if (dist > 15) {
        a = 0; // transparent corners
      } else if (dist >= 13.5 && dist <= 15) {
        // Gold border
        r = 234; g = 179; b = 8; a = 255;
      } else {
        // Center "L" shape: vertical stem x: 10..15, y: 8..23; base x: 10..22, y: 19..23
        const inStem = (x >= 10 && x <= 15 && y >= 8 && y <= 23);
        const inBase = (x >= 10 && x <= 22 && y >= 18 && y <= 23);
        const inDiamond = (Math.abs(dx) + Math.abs(dy) <= 9 && Math.abs(dx) + Math.abs(dy) >= 7);
        
        if (inStem || inBase) {
          // Gold Letter L
          r = 253; g = 224; b = 71; a = 255;
        } else if (inDiamond) {
          // Blue glow diamond
          r = 96; g = 165; b = 250; a = 200;
        }
      }
      
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }
  
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const png = createPng32();

// Create valid ICO file containing this PNG
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // ICO type
icoHeader.writeUInt16LE(1, 4); // 1 image

const icoDir = Buffer.alloc(16);
icoDir.writeUInt8(32, 0); // width 32
icoDir.writeUInt8(32, 1); // height 32
icoDir.writeUInt8(0, 2);  // color count
icoDir.writeUInt8(0, 3);  // reserved
icoDir.writeUInt16LE(1, 4); // color planes
icoDir.writeUInt16LE(32, 6); // 32 bits per pixel
icoDir.writeUInt32LE(png.length, 8); // size of image data
icoDir.writeUInt32LE(22, 12); // offset = 6 + 16 = 22

const icoBuffer = Buffer.concat([icoHeader, icoDir, png]);

fs.writeFileSync('public/favicon.ico', icoBuffer);
fs.writeFileSync('app/favicon.ico', icoBuffer);
console.log('Favicon.ico successfully created in public/ and app/!');
