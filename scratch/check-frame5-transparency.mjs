import fs from "fs"
import zlib from "zlib"

function checkTransparency(path) {
  const buf = fs.readFileSync(path)
  const colorType = buf[25]
  console.log("Color type:", colorType, "(6 = RGBA, 2 = RGB)")
  
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

  console.log(`Dimensions: ${width}x${height}`)
  let transparentCount = 0
  let opaqueCount = 0
  let whiteCount = 0

  const bytesPerPixel = 4
  const bytesPerLine = 1 + width * bytesPerPixel

  // Sample 100,000 pixels across the image
  for (let y = 0; y < height; y += 10) {
    const lineStart = y * bytesPerLine
    for (let x = 0; x < width; x += 10) {
      const p = lineStart + 1 + x * bytesPerPixel
      const r = uncompressed[p]
      const g = uncompressed[p + 1]
      const b = uncompressed[p + 2]
      const a = uncompressed[p + 3]

      if (a < 50) {
        transparentCount++
      } else {
        opaqueCount++
        if (r > 250 && g > 250 && b > 250) {
          whiteCount++
        }
      }
    }
  }

  console.log(`Samples: opaque=${opaqueCount}, transparent=${transparentCount}, pure_white=${whiteCount}`)
  if (transparentCount === 0) {
    console.log("ALERT: THIS IMAGE HAS ZERO TRANSPARENCY! IT IS 100% OPAQUE!")
  }
}

checkTransparency("scratch/conacce.png")
