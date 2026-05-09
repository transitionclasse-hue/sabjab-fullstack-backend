import Tesseract from 'tesseract.js';

/**
 * PURE OCR SERVICE
 * Now hardened to capture ALL prices and lines, especially useful for variants.
 */

export const handleProductExtraction = async (request, reply) => {
    try {
        let data = request.body?.file || request.body?.image;
        if (Array.isArray(data)) data = data[0];
        if (!data) return reply.code(400).send({ success: false, message: "No image provided." });

        let buffer = data._buf || data.buffer;
        if (!buffer && typeof data.toBuffer === 'function') buffer = await data.toBuffer();
        if (!buffer && data.file) {
            const chunks = [];
            for await (const chunk of data.file) { chunks.push(chunk); }
            buffer = Buffer.concat(chunks);
        }

        if (!buffer || buffer.length === 0) return reply.code(400).send({ success: false, message: "Empty image." });

        console.log(`🔍 Variant-Aware OCR Extraction...`);
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
        
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        // Robust price extraction: capturing all instances of ₹XXX and MRP ₹YYY
        // We use a global match to ensure we get prices from all variant boxes
        const priceRegex = /(?:rs\.?|₹|inr|mrp)\s*:?\s?(\d+[,.]?\d*)/gi;
        const prices = [];
        let match;
        while ((match = priceRegex.exec(text)) !== null) {
            const val = match[1].replace(',', '');
            if (parseFloat(val) > 1) prices.push(val);
        }

        return reply.send({
            success: true,
            data: {
                lines,
                prices,
                fullText: text
            }
        });
    } catch (error) {
        console.error("Variant OCR Error:", error);
        return reply.code(500).send({
            success: false,
            message: "OCR service failed",
            details: error.message
        });
    }
};

export const extractProductInfoFromImage = async (buffer) => {
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    return { name: lines[0] || "", price: 0, raw: { lines } };
};
