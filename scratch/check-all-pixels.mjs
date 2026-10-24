import fs from "fs"
import zlib from "zlib"

function checkImage(name, path) {
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

  const cx = Math.floor(width / 2)
  const cy = Math.floor(height / 2)
  console.log(`${name} (${width}x${height}) Center pixel (${cx}, ${cy}):`, getPixel(cx, cy))
}

checkImage("ce_qui_est_la", "scratch/ce_qui_est_la.png")
checkImage("luytdfghjkl", "scratch/luytdfghjkl.png")
checkImage("loiuytrd", "scratch/loiuytrd.png")
checkImage("brunch", "scratch/brunch.png")
