import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

export const uploadRoutes = async (fastify, options) => {
    fastify.post('/upload', async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.code(400).send({ message: 'No file uploaded' });
            }

            const buffer = await data.toBuffer();

            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'sabjab_manager',
                        resource_type: 'auto'
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                streamifier.createReadStream(buffer).pipe(uploadStream);
            });

            return reply.send({ url: result.secure_url });
        } catch (error) {
            console.error('Upload Error:', error);
            return reply.code(500).send({ message: 'Upload failed', error: error.message });
        }
    });
};
