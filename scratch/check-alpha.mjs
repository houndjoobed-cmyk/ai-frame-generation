import fs from "fs"

// A simple PNG parser to inspect pixel values in IDAT
// Or let's test using canvas/fabric in node, or check if fabric is available
import * as fabric from "fabric"

async function checkAlpha() {
  const buf = fs.readFileSync("scratch/sample-frame.png")
  // Let's check with fabric or raw bytes
  console.log("PNG size:", buf.length)
  // Let's look for tRNS chunk or color type in IHDR
  // IHDR: 8 bytes signature, 4 bytes chunk length, 4 bytes 'IHDR', 4 bytes width, 4 bytes height, 1 byte bit depth, 1 byte color type...
  const colorType = buf[25]
  console.log("Color type:", colorType) 
  // 0: Grayscale, 2: RGB, 3: Indexed, 4: Grayscale+Alpha, 6: RGBA
  if (colorType === 6) {
    console.log("PNG has Alpha channel (RGBA)!")
  } else if (colorType === 2) {
    console.log("PNG is RGB ONLY (NO ALPHA CHANNEL! OPAQUE!)")
  } else if (colorType === 3) {
    console.log("PNG is Indexed")
  }
}

checkAlpha().catch(console.error)
