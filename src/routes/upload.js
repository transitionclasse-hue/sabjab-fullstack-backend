import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

import fastifyMultipart from '@fastify/multipart';

// Ensure configuration is applied in this module too
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

import { verifyToken, verifyManager } from '../middleware/auth.js';
import { handleProductExtraction } from '../controllers/managerOCR.js';

export const uploadRoutes = async (fastify, options) => {
    // Register multipart locally to avoid conflicts with global AdminJS config
    await fastify.register(fastifyMultipart, {
        attachFieldsToBody: true,
        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB
        }
    });

    fastify.post('/manager/extract-product-info', { preHandler: [verifyManager] }, handleProductExtraction);

    fastify.post('/upload', { preHandler: [verifyToken] }, async (request, reply) => {
        try {
            console.log("📦 Incoming Upload. Headers:", JSON.stringify(request.headers));

            // Check for file in common locations
            let data = request.body?.file || request.body?.image;

            // Log body keys to see what actually arrived
            if (request.body) {
                console.log("📦 Body Keys:", Object.keys(request.body));
            } else {
                console.log("📦 Body is NULL or UNDEFINED");
            }

            if (Array.isArray(data)) {
                console.log("📂 Unpacking array-wrapped file");
                data = data[0];
            }

            if (!data) {
                console.warn("⚠️ Data not found in request.body.file. Keys found:", request.body ? Object.keys(request.body) : 'none');
                return reply.code(400).send({
                    success: false,
                    message: "No file provided. Please ensure the body has a 'file' field."
                });
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
                return reply.code(400).send({ success: false, message: "File content is missing or empty." });
            }

            console.log("📤 Sending to Cloudinary. Size:", buffer.length);
            
            let mimetype = data.mimetype || 'image/jpeg';
            if (mimetype === 'image') mimetype = 'image/jpeg';
            if (mimetype === 'video') mimetype = 'video/mp4';

            const base64File = `data:${mimetype};base64,${buffer.toString('base64')}`;

            const result = await cloudinary.uploader.upload(base64File, {
                folder: 'sabjab_manager',
                resource_type: 'auto'
            });

            return reply.send({ success: true, url: result.secure_url });
        } catch (error) {
            console.error('❌ Upload Controller Error:', error);
            return reply.code(500).send({
                success: false,
                message: 'Upload failed on server side',
                details: error.message
            });
        }
    });
};
