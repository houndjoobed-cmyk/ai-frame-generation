import fs from "fs"
import zlib from "zlib"

function readPNG(path) {
  const buf = fs.readFileSync(path)
  let pos = 8 // Skip PNG signature
  let idatParts = []
  let width, height

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.slice(pos + 4, pos + 8).toString("ascii")
    if (type === "IHDR") {
      width = buf.readUInt32BE(pos + 8)
      height = buf.readUInt32BE(pos + 12)
    } else if (type === "IDAT") {
      idatParts.push(buf.slice(pos + 8, pos + 8 + len))
    }
    pos += 12 + len
  }

  const idat = Buffer.concat(idatParts)
  const uncompressed = zlib.inflateSync(idat)

  console.log(`PNG: ${width}x${height}`)

  // Each scanline: 1 byte filter + width * 4 bytes (RGBA)
  const bytesPerPixel = 4
  const bytesPerLine = 1 + width * bytesPerPixel

  function getPixel(x, y) {
    const lineStart = y * bytesPerLine
    const pixelStart = lineStart + 1 + x * bytesPerPixel
    return {
      r: uncompressed[pixelStart],
      g: uncompressed[pixelStart + 1],
      b: uncompressed[pixelStart + 2],
      a: uncompressed[pixelStart + 3]
    }
  }

  console.log("Top-left pixel (10, 10):", getPixel(10, 10))
  console.log("Center pixel (960, 960):", getPixel(960, 960))
  console.log("Mid-left frame pixel (300, 960):", getPixel(300, 960))
  console.log("Gold frame border (500, 500):", getPixel(500, 500))
}

readPNG("scratch/sample-frame.png")
