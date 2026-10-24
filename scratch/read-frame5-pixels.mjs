import fs from "fs"
import zlib from "zlib"

function readPNG(path) {
  const buf = fs.readFileSync(path)
  let pos = 8
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

  // Inside the rectangle (approx x: 3000, y: 4000)
  console.log("Rectangle center (3200, 4100):", getPixel(3200, 4100))
  // Outside rectangle in blue background (x: 1000, y: 4000)
  console.log("Blue background (1000, 4000):", getPixel(1000, 4000))
}

readPNG("scratch/frame-5.png")
