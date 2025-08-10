const fs = require('fs');

// Simple ICO file creation (32x32, basic format)
// This creates a very basic ICO file with a green "K" logo

// ICO file header (6 bytes)
const icoHeader = Buffer.from([
    0x00, 0x00, // Reserved (must be 0)
    0x01, 0x00, // Type (1 = ICO)
    0x01, 0x00  // Number of images (1)
]);

// ICO directory entry (16 bytes)
const icoDirectory = Buffer.from([
    0x20,       // Width (32)
    0x20,       // Height (32)  
    0x00,       // Color count (0 = 256+ colors)
    0x00,       // Reserved
    0x01, 0x00, // Planes (1)
    0x20, 0x00, // Bits per pixel (32)
    0x80, 0x02, 0x00, 0x00, // Size of image data (640 bytes)
    0x16, 0x00, 0x00, 0x00  // Offset to image data (22 bytes)
]);

// Create a simple 32x32 RGBA bitmap
const width = 32;
const height = 32;
const imageData = Buffer.alloc(width * height * 4); // RGBA

// Fill with transparent background and green circle with "K"
for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4;
        const dx = x - 16;
        const dy = y - 16;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= 15) {
            // Green circle
            imageData[offset] = 16;      // B
            imageData[offset + 1] = 185; // G  
            imageData[offset + 2] = 129; // R
            imageData[offset + 3] = 255; // A
            
            // Add "K" shape (simplified)
            if ((x >= 14 && x <= 16 && y >= 8 && y <= 24) || // Vertical line
                (x >= 16 && x <= 20 && y >= 14 && y <= 16) || // Top diagonal
                (x >= 16 && x <= 20 && y >= 16 && y <= 18)) { // Bottom diagonal
                imageData[offset] = 255;     // B (white)
                imageData[offset + 1] = 255; // G
                imageData[offset + 2] = 255; // R
                imageData[offset + 3] = 255; // A
            }
        } else {
            // Transparent
            imageData[offset] = 0;
            imageData[offset + 1] = 0;
            imageData[offset + 2] = 0;
            imageData[offset + 3] = 0;
        }
    }
}

// BMP header for the embedded bitmap (40 bytes)
const bmpHeader = Buffer.from([
    0x28, 0x00, 0x00, 0x00, // Header size (40)
    0x20, 0x00, 0x00, 0x00, // Width (32)
    0x40, 0x00, 0x00, 0x00, // Height (64, because ICO stores as 2x for mask)
    0x01, 0x00,             // Planes (1)
    0x20, 0x00,             // Bits per pixel (32)
    0x00, 0x00, 0x00, 0x00, // Compression (0 = none)
    0x00, 0x02, 0x00, 0x00, // Image size (512)
    0x00, 0x00, 0x00, 0x00, // X pixels per meter
    0x00, 0x00, 0x00, 0x00, // Y pixels per meter
    0x00, 0x00, 0x00, 0x00, // Colors used
    0x00, 0x00, 0x00, 0x00  // Important colors
]);

// Convert RGBA to BGRA and flip vertically for BMP format
const bmpData = Buffer.alloc(width * height * 4);
for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const srcOffset = (y * width + x) * 4;
        const dstOffset = ((height - 1 - y) * width + x) * 4;
        
        bmpData[dstOffset] = imageData[srcOffset];         // B
        bmpData[dstOffset + 1] = imageData[srcOffset + 1]; // G
        bmpData[dstOffset + 2] = imageData[srcOffset + 2]; // R
        bmpData[dstOffset + 3] = imageData[srcOffset + 3]; // A
    }
}

// AND mask (1 bit per pixel, all zeros for no transparency mask)
const andMask = Buffer.alloc(width * height / 8);

// Combine all parts
const icoFile = Buffer.concat([
    icoHeader,
    icoDirectory,
    bmpHeader,
    bmpData,
    andMask
]);

// Write the ICO file
fs.writeFileSync('favicon.ico', icoFile);

console.log('Favicon.ico created successfully!');
