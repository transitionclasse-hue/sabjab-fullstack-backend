import Tesseract from 'tesseract.js';

/**
 * Universal OCR Extraction Engine
 * Specifically tuned for the 'Blinkit Style' vertical hierarchy.
 */

const extractRawData = (text) => {
    // Split by lines and clean them
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    return { lines };
};

const applyRules = (rawData, rules = {}) => {
    const { lines } = rawData;
    const { strategy = 'standard' } = rules;

    if (strategy === 'blinkit') {
        // STRICT BLINKIT HIERARCHY:
        // 1. Name
        // 2. Quantity
        // 3. Price & MRP Line
        // 4. Discount Info
        // 5. Unit Rate
        
        let name = lines[0] || "";
        let quantity = lines[1] || "1 unit";
        
        // Find the price line (contains currency symbol and usually 'MRP')
        const priceLine = lines.find(l => l.includes('₹') || l.includes('MRP')) || "";
        const allNumbersInPriceLine = priceLine.match(/\d+[,.]?\d*/g) || [];
        
        // In Blinkit: First number is Selling Price, Second is MRP
        let sellingPrice = allNumbersInPriceLine[0] ? allNumbersInPriceLine[0].replace(',', '') : 0;
        let mrp = allNumbersInPriceLine[1] ? allNumbersInPriceLine[1].replace(',', '') : sellingPrice;

        // Lines following the price are usually OFF info and Unit Rate
        const remainingLines = lines.slice(lines.indexOf(priceLine) + 1);
        const description = remainingLines.join(' | ');

        return {
            name: name.substring(0, 100),
            quantity: quantity,
            mrp: mrp,
            price: sellingPrice,
            description: description,
            raw: { lines }
        };
    }

    // FALLBACK / STANDARD LOGIC
    const text = lines.join('\n');
    const priceRegex = /(?:rs\.?|₹|inr)\s?(\d+(?:\.\d{2})?)|\b(\d+\.\d{2})\b|\b(\d{2,5})\b/gi;
    const prices = [];
    let match;
    while ((match = priceRegex.exec(text)) !== null) {
        const val = parseFloat(match[1] || match[2] || match[3]);
        if (val > 1 && !prices.includes(val)) prices.push(val);
    }
    const sortedPrices = [...prices].sort((a, b) => b - a);

    let mrp = sortedPrices.length >= 1 ? sortedPrices[0] : 0;
    let sellingPrice = sortedPrices.length >= 2 ? sortedPrices[1] : mrp;

    let nameCandidate = lines.find(l => l.length > 5 && !l.includes('₹') && !/^\d+$/.test(l)) || "";

    return {
        name: nameCandidate.substring(0, 100),
        quantity: "1 unit",
        mrp,
        price: sellingPrice,
        description: "",
        raw: { lines }
    };
};

export const handleProductExtraction = async (request, reply) => {
    try {
        let data = request.body?.file || request.body?.image;
        
        // We now look for 'strategy' name directly to choose the logic
        const rules = typeof request.body?.rules === 'string' 
            ? JSON.parse(request.body.rules) 
            : (request.body?.rules || {});
        
        // If the frontend sent ocrStyle, map it to strategy rule
        const strategy = request.body?.ocrStyle || rules.strategy || 'standard';

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

        console.log(`🔍 Processing OCR with style: ${strategy}`);
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
        console.log("📝 OCR Text Raw:", text);

        const rawData = extractRawData(text);
        const result = applyRules(rawData, { ...rules, strategy });

        return reply.send({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("OCR Extraction Error:", error);
        return reply.code(500).send({
            success: false,
            message: "Extraction failed",
            details: error.message
        });
    }
};

export const extractProductInfoFromImage = async (buffer) => {
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
    return applyRules(extractRawData(text), { strategy: 'standard' });
};
