import Tesseract from 'tesseract.js';

/**
 * PURE OCR SERVICE
 * This controller is now a 'Dumb Service'. It only extracts raw lines and prices.
 * The 'Intelligence' (Styles/Rules) now lives entirely in the Manager Website.
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

        console.log(`🔍 Executing Pure OCR Extraction...`);
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
        
        // 1. Raw Lines
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        // 2. All identified prices
        const priceRegex = /(?:rs\.?|₹|inr)\s?(\d+(?:\.\d{1,2})?)|\b(\d+\.\d{2})\b|\b(\d{2,5})\b/gi;
        const prices = [];
        let match;
        while ((match = priceRegex.exec(text)) !== null) {
            const val = match[1] || match[2] || match[3];
            if (val && !prices.includes(val)) prices.push(val.replace(',', ''));
        }

        // Return everything to the frontend
        return reply.send({
            success: true,
            data: {
                lines,
                prices,
                fullText: text
            }
        });
    } catch (error) {
        console.error("Pure OCR Error:", error);
        return reply.code(500).send({
            success: false,
            message: "OCR service failed",
            details: error.message
        });
    }
};

// Legacy support
export const extractProductInfoFromImage = async (buffer) => {
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    return { name: lines[0] || "", price: 0, raw: { lines } };
};
