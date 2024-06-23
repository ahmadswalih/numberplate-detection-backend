const fs = require("fs");
const pdf = require("pdf-parse");

const pdfPath = "./data.pdf"; // Path to your PDF file

const extractTextFromPdf = async (pdfPath) => {
  const dataBuffer = fs.readFileSync(pdfPath);
  try {
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw error;
  }
};

module.exports = extractTextFromPdf;
