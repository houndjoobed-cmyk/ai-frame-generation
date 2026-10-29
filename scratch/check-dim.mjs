import fs from "fs"

const buffer = fs.readFileSync("scratch/downloaded-frame.png")
// PNG header: width is at offset 16 (4 bytes), height is at offset 20 (4 bytes)
const width = buffer.readUInt32BE(16)
const height = buffer.readUInt32BE(20)

console.log(`Image dimensions: ${width} x ${height}`)
