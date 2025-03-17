import express from "express";
import multer from "multer";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: "uploads/" });
const OUTPUT_DIR = path.join(__dirname, "outputs");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Extract text with positions from PDF
async function extractTextWithPositions(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const pdfDocument = await getDocument({
    data,
    standardFontDataUrl: "node_modules/pdfjs-dist/standard_fonts/",
  }).promise;

  let extractedData = [];

  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items.map((item) => ({
      str: item.str.trim(),
      x: Math.round(item.transform[4]),
      y: Math.round(item.transform[5]),
    }));
    extractedData.push(items);
  }
  console.log("Extracted Text with Positions:", extractedData);
  return extractedData;
}

// Detect multiple tables and separate them
function detectTables(textData) {
  let tables = [];
  let currentTable = [];
  let lastY = null;
  let lastRowLength = null;

  textData.forEach((page) => {
    let rows = {};

    // Sort text elements by Y (top to bottom), then X (left to right)
    page.sort((a, b) => b.y - a.y || a.x - b.x);

    // Group elements by approximate Y-coordinates (row detection)
    page.forEach((item) => {
      let yKey = Math.round(item.y / 3) * 3; // Normalize Y for grouping

      if (!rows[yKey]) rows[yKey] = [];
      rows[yKey].push(item);
    });

    // Convert grouped rows into structured tables
    let table = Object.values(rows).map((row) =>
      row.sort((a, b) => a.x - b.x).map((item) => item.str)
    );

    // Filter out empty rows & reverse for correct order
    table = table.filter((row) => row.length > 1).reverse();

    // Detect table breaks based on spacing or structure change
    table.forEach((row) => {
      if (lastY !== null && Math.abs(row[0].y - lastY) > 20) {
        if (currentTable.length > 1) tables.push([...currentTable]);
        currentTable = [];
      }
      if (lastRowLength !== null && Math.abs(row.length - lastRowLength) > 2) {
        if (currentTable.length > 1) tables.push([...currentTable]);
        currentTable = [];
      }
      currentTable.push(row);
      lastY = row[0].y;
      lastRowLength = row.length;
    });
  });

  if (currentTable.length > 1) tables.push([...currentTable]);
  console.log("Detected Tables:", tables);
  return tables;
}

// Save tables into separate sheets in Excel
async function saveToExcel(tables, outputPath) {
  if (tables.length === 0) {
    console.warn("No tables found, skipping Excel creation");
    return;
  }
  const workbook = new ExcelJS.Workbook();

  tables.forEach((table, tableIndex) => {
    let worksheet = workbook.addWorksheet(`Table ${tableIndex + 1}`);

    // Add table data
    table.forEach((row) => worksheet.addRow(row));

    // Apply borders to table
    worksheet.eachRow((row, rowNum) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });
  });

  await workbook.xlsx.writeFile(outputPath);
}

// API Endpoint to upload PDF and extract tables
app.post("/extract", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");

    const pdfPath = req.file.path;
    const textData = await extractTextWithPositions(pdfPath);
    const tables = detectTables(textData);

    if (tables.length === 0) {
      return res.status(400).send("No tables detected in the PDF");
    }

    const outputPath = path.join(OUTPUT_DIR, `${req.file.filename}.xlsx`);
    await saveToExcel(tables, outputPath);

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=extracted_tables.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.sendFile(outputPath, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).send("Error downloading file");
      } else {
        console.log("File sent successfully.");
      }
      // Cleanup
      fs.unlinkSync(pdfPath);
      fs.unlinkSync(outputPath);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error processing file");
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
