import Tesseract from 'tesseract.js';

/**
 * Universal OCR Extraction Engine
 * This controller is now generic. It extracts all potential data points 
 * and applies selection 'rules' passed from the frontend.
 */

const extractRawData = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Extract all potential prices
    const priceRegex = /(?:rs\.?|₹|inr)\s?(\d+(?:\.\d{2})?)|\b(\d+\.\d{2})\b|\b(\d{2,5})\b/gi;
    const prices = [];
    let match;
    while ((match = priceRegex.exec(text)) !== null) {
        const val = parseFloat(match[1] || match[2] || match[3]);
        if (val > 1 && !prices.includes(val)) prices.push(val);
    }
    const sortedPrices = [...prices].sort((a, b) => b - a); // Highest first (MRP)

    // Extract unit patterns
    const unitRegex = /(\d+\s*(?:ml|l|g|kg|unit|pack|pc|lb|oz))/gi;
    const units = text.match(unitRegex) || [];

    // Extract discount patterns
    const discountRegex = /(\d+%\s*OFF)/gi;
    const discounts = text.match(discountRegex) || [];

    return { lines, sortedPrices, units, discounts };
};

const applyRules = (rawData, rules = {}) => {
    const { lines, sortedPrices, units, discounts } = rawData;
    const {
        nameStrategy = 'first_valid', // 'first_valid' | 'line_index'
        nameIndex = 0,
        priceStrategy = 'highest_is_mrp', // 'highest_is_mrp' | 'lowest_is_selling'
        captureUnits = true,
        captureDiscounts = true
    } = rules;

    let name = "";
    if (nameStrategy === 'line_index') {
        name = lines[nameIndex] || "";
    } else {
        // Skip purely numeric lines or lines with currency symbols for name
        name = lines.find(l => l.length > 3 && !/^\d+$/.test(l) && !l.includes('₹')) || "";
    }

    let mrp = 0;
    let sellingPrice = 0;

    if (sortedPrices.length >= 2) {
        // Standard: Higher is MRP, Lower is Selling
        mrp = sortedPrices[0];
        sellingPrice = sortedPrices[1];
    } else if (sortedPrices.length === 1) {
        mrp = sortedPrices[0];
        sellingPrice = sortedPrices[0];
    }

    const descriptionParts = [];
    if (captureUnits && units.length > 0) descriptionParts.push(units[0]);
    if (captureDiscounts && discounts.length > 0) descriptionParts.push(discounts[0]);

    return {
        name: name.substring(0, 100),
        mrp,
        price: sellingPrice,
        description: descriptionParts.join(' | '),
        raw: { lines, prices: sortedPrices, units, discounts } // Return raw for frontend debugging
    };
};

export const handleProductExtraction = async (request, reply) => {
    try {
        let data = request.body?.file || request.body?.image;
        
        // Rules can now be passed from frontend to define 'Style'
        const rules = typeof request.body?.rules === 'string' 
            ? JSON.parse(request.body.rules) 
            : (request.body?.rules || {});

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

        const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
        
        const rawData = extractRawData(text);
        const result = applyRules(rawData, rules);

        return reply.send({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Universal OCR Error:", error);
        return reply.code(500).send({
            success: false,
            message: "Extraction failed",
            details: error.message
        });
    }
};

// Compatibility export
export const extractProductInfoFromImage = async (buffer) => {
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
    return applyRules(extractRawData(text));
};
