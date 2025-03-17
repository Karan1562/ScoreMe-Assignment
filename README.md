# ScoreMe

## PDF Table Extraction API

## Overview
This project is a **PDF table extraction API** that allows users to upload a **PDF file**, extract tabular data, and download the extracted data in **Excel format**. It is built using **Node.js** with libraries like `express`, `pdf.js`, `multer`, and `ExcelJS`.

Three sample PDFs have been attached for testing.

## Features
- **Upload PDF files** via API
- **Extract tabular data** while maintaining structure
- **Download extracted tables** in Excel format
- **Handles multiple pages and tables**
- **API tested using Postman**

## Technologies Used
- **Node.js** - Backend framework
- **Express.js** - Web framework
- **Multer** - File upload middleware
- **pdf.js** - Extracts text from PDF
- **ExcelJS** - Writes extracted data to Excel
- **Postman** - Used for API testing

## Installation & Setup
Follow these steps to set up the project locally:

1. **Clone the repository**
   ```sh
   git clone https://github.com/Karan1562/ScoreMe-Assignment.git
   cd ScoreMe-Assignment
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Run the server**
   ```sh
   node index.js
   ```

4. **Server starts on `http://localhost:3000`**

## Usage (Using Postman)
1. Open **Postman**.
2. Select **POST** request.
3. Enter the API URL:
   ```
   http://localhost:3000/extract
   ```
4. Go to **Body** → Select **form-data**.
5. Add a key **pdf** (file type) and upload a sample PDF.
6. Click **Send**.
7. The API will return an **Excel file** with extracted tables.

## API Endpoint
| Method | Endpoint        | Description                          |
|--------|---------------|----------------------------------|
| POST   | `/extract`    | Uploads PDF and extracts tables |

## Example Response
- The API will return an Excel file (`.xlsx`) containing extracted tables.

## Repository
Find the complete implementation here: [GitHub Repository](https://github.com/Karan1562/ScoreMe-Assignment)

## Future Enhancements
- Support for **scanned PDFs** using OCR.
- Advanced **table structure detection** for complex layouts.
- Web UI for easy **drag-and-drop file uploads**.
