import * as fabric from "fabric"

console.log("Fabric version:", fabric.version)
console.log("FabricImage:", typeof fabric.FabricImage)
console.log("FabricImage.fromURL:", typeof fabric.FabricImage.fromURL)

const canvas = new fabric.Canvas(null, { width: 800, height: 800 })
console.log("Canvas created successfully")
