const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Initializing jsPDF...");
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.text("FACTURE / INVOICE", 20, 20);
  
  doc.setFontSize(12);
  doc.text("Event Frames Inc.", 20, 35);
  doc.text("Date: " + new Date().toLocaleDateString(), 20, 45);
  
  doc.line(20, 50, 190, 50);
  
  doc.text("Description: Service Premium Photo Frame", 20, 60);
  doc.text("Montant: 5,000 FCFA", 20, 70);
  
  const buffer = doc.output('arraybuffer');
  console.log("PDF buffer size:", buffer.byteLength);
  
  const outputPath = path.join(__dirname, 'test_invoice.pdf');
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  console.log("PDF written successfully to:", outputPath);
}

main().catch(console.error);
