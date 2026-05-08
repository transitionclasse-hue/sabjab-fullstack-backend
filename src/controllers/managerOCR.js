import Tesseract from 'tesseract.js';

/**
 * Extracts product information (Name, MRP) from an image buffer using OCR.
 * @param {Buffer} buffer - The image buffer to process.
 * @returns {Promise<{name: string, price: string}>}
 */
export const extractProductInfoFromImage = async (buffer) => {
    try {
        console.log("🔍 Starting OCR Processing...");
        const { data: { text } } = await Tesseract.recognize(
            buffer,
            'eng',
            { logger: m => console.log(m.status + ': ' + m.progress) }
        );

        console.log("📝 OCR Text Extracted:", text);

        // Basic parsing logic
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        let mrp = "";
        let productName = "";

        // 1. Try to find MRP
        // Patterns: MRP: 50, Rs. 50, Price 50, etc.
        const mrpRegex = /(?:MRP|M\.R\.P\.|Rs\.|PRICE|₹)\s*:?\s*(\d+(?:\.\d{2})?)/i;
        for (const line of lines) {
            const match = line.match(mrpRegex);
            if (match && match[1]) {
                mrp = match[1];
                break;
            }
        }

        // 2. Try to find Product Name
        // Usually, the product name is in the first few lines and is relatively short.
        // We avoid lines that look like numbers or dates.
        const nonProductPatterns = [/^\d+$/, /\d{2}\/\d{2}\/\d{4}/, /BATCH/i, /MFD/i, /EXP/i, /USE BY/i, /NET WT/i, /GRAMS/i, /KG/i];
        
        for (let i = 0; i < Math.min(lines.length, 5); i++) {
            const line = lines[i];
            const isTechnicalLine = nonProductPatterns.some(p => p.test(line));
            const isPriceLine = line.match(mrpRegex);

            if (!isTechnicalLine && !isPriceLine && line.length > 3) {
                productName = line;
                break;
            }
        }

        return {
            name: productName || "Unknown Product",
            price: mrp || "0"
        };
    } catch (error) {
        console.error("❌ OCR Extraction Error:", error);
        throw error;
    }
};

export const handleProductExtraction = async (request, reply) => {
    try {
        let data = request.body?.file || request.body?.image;

        if (Array.isArray(data)) {
            data = data[0];
        }

        if (!data) {
            return reply.code(400).send({ success: false, message: "No image provided for OCR." });
        }

        let buffer = data._buf || data.buffer;
        if (!buffer && typeof data.toBuffer === 'function') {
            buffer = await data.toBuffer();
        }

        if (!buffer && data.file) {
            const chunks = [];
            for await (const chunk of data.file) { chunks.push(chunk); }
            buffer = Buffer.concat(chunks);
        }

        if (!buffer || buffer.length === 0) {
            return reply.code(400).send({ success: false, message: "Image content is empty." });
        }

        const info = await extractProductInfoFromImage(buffer);
        
        return reply.send({
            success: true,
            data: info
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: "Failed to extract product info",
            details: error.message
        });
    }
};
