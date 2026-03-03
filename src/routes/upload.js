import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

// Ensure configuration is applied in this module too
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadRoutes = async (fastify, options) => {
    fastify.post('/upload', async (request, reply) => {
        try {
            // Support both direct file stream and attachFieldsToBody
            let data = request.body?.file;
            if (!data && typeof request.file === 'function') {
                data = await request.file();
            }

            if (!data) {
                return reply.code(400).send({
                    success: false,
                    message: 'No file uploaded. Make sure field name is "file".'
                });
            }

            let buffer;
            if (data._buf && Buffer.isBuffer(data._buf)) {
                buffer = data._buf;
            } else if (typeof data.toBuffer === 'function') {
                buffer = await data.toBuffer();
            } else if (data.buffer && Buffer.isBuffer(data.buffer)) {
                buffer = data.buffer;
            } else if (data.file) {
                const chunks = [];
                for await (const chunk of data.file) {
                    chunks.push(chunk);
                }
                buffer = Buffer.concat(chunks);
            }

            if (!buffer || buffer.length === 0) {
                return reply.code(400).send({ success: false, message: 'File buffer is empty or could not be read.' });
            }

            const base64File = `data:${data.mimetype || 'image/jpeg'};base64,${buffer.toString('base64')}`;

            const result = await cloudinary.uploader.upload(base64File, {
                folder: 'sabjab_manager',
                resource_type: 'auto'
            });

            return reply.send({ success: true, url: result.secure_url });
        } catch (error) {
            console.error('❌ Upload Controller Error:', error);
            return reply.code(500).send({
                success: false,
                message: 'Internal server error during upload',
                details: error.message,
                suggestion: 'Check if Cloudinary environment variables are set correctly on server.'
            });
        }
    });
};
