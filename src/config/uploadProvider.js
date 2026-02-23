import { BaseProvider } from '@adminjs/upload';
import { v2 as cloudinary } from 'cloudinary';
import { env } from 'process';
import dotenv from 'dotenv';
import streamifier from 'streamifier';
import fs from 'fs';
import { Readable } from 'stream';

dotenv.config();

// Configure Cloudinary globally using ENV vars loaded from .env
cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
});

export class CloudinaryProvider extends BaseProvider {
    constructor() {
        super('cloudinary');
    }

    /**
     * Upload a file to Cloudinary.
     * AdminJS + Fastify can send the file in multiple formats:
     *   1. file.path  — temp disk path (Formidable style)
     *   2. file.buffer — in-memory Buffer (Fastify multipart)
     *   3. file itself as a Buffer
     *   4. file.file   — readable stream
     * We handle ALL of them.
     */
    async upload(file, key) {
        // PATCH: AdminJS + @adminjs/fastify patch (postinstall-patch.js) 
        // sometimes wraps the file object in an array [fileObj]. 
        // We unpack it here for consistency.
        if (Array.isArray(file) && file.length > 0) {
            file = file[0];
            console.log("📂 Unpacked file from array");
        }

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    public_id: key,
                    folder: 'sabjab_admin',
                    resource_type: 'auto'
                },
                (error, result) => {
                    if (error) {
                        logToFile(`❌ Cloudinary Upload Error: ${JSON.stringify(error)}`);
                        console.error('❌ Cloudinary Upload Error:', error);
                        return reject(error);
                    }
                    logToFile(`✅ Cloudinary Upload Success: ${result.secure_url}`);
                    console.log('✅ Cloudinary Upload Success:', result.secure_url);
                    // Store the last uploaded URL so the after-hook can use it
                    this.lastUploadedUrl = result.secure_url;
                    resolve(result);
                }
            );

            // Debug: log the file object structure
            logToFile(`📦 AdminJS file payload keys: ${file ? Object.keys(file) : 'null'}`);
            console.log("📦 AdminJS file payload keys:", file ? Object.keys(file) : 'null');
            console.log("📦 File type:", typeof file);
            if (file) {
                logToFile(`📦 file.size: ${file.size}`);
                console.log("📦 file.path:", file.path);
                console.log("📦 file.buffer:", file.buffer ? `Buffer(${file.buffer.length} bytes)` : 'undefined');
                console.log("📦 file.size:", file.size);
                console.log("📦 Buffer.isBuffer(file):", Buffer.isBuffer(file));
            }

            try {
                // Strategy 1: file.path exists on disk (Formidable temp file)
                if (file && file.path && fs.existsSync(file.path)) {
                    console.log("📤 Uploading via file.path:", file.path);
                    fs.createReadStream(file.path).pipe(uploadStream);
                    return;
                }

                // Strategy 2: file.buffer is a Buffer (Fastify @fastify/multipart)
                if (file && file.buffer && Buffer.isBuffer(file.buffer)) {
                    console.log("📤 Uploading via file.buffer:", file.buffer.length, "bytes");
                    streamifier.createReadStream(file.buffer).pipe(uploadStream);
                    return;
                }

                // Strategy 3: file itself is a Buffer
                if (file && Buffer.isBuffer(file)) {
                    console.log("📤 Uploading via Buffer (file is Buffer):", file.length, "bytes");
                    streamifier.createReadStream(file).pipe(uploadStream);
                    return;
                }

                // Strategy 4: file.file is a readable stream
                if (file && file.file && typeof file.file.pipe === 'function') {
                    console.log("📤 Uploading via file.file stream");
                    file.file.pipe(uploadStream);
                    return;
                }

                // Strategy 5: file has a stream() method (Web File API)
                if (file && typeof file.stream === 'function') {
                    console.log("📤 Uploading via file.stream()");
                    const nodeStream = file.stream();
                    if (typeof nodeStream.pipe === 'function') {
                        nodeStream.pipe(uploadStream);
                    } else {
                        // It's a Web ReadableStream, convert to Node stream
                        Readable.fromWeb(nodeStream).pipe(uploadStream);
                    }
                    return;
                }

                // Strategy 6: file has raw data in some other property
                if (file && file.data && Buffer.isBuffer(file.data)) {
                    console.log("📤 Uploading via file.data:", file.data.length, "bytes");
                    streamifier.createReadStream(file.data).pipe(uploadStream);
                    return;
                }

                // None of the strategies worked
                logToFile("❌ Cannot determine file source");
                console.error("❌ Cannot determine file source. Full file object:", JSON.stringify(file, null, 2));
                reject(new Error("File upload failed: cannot determine file source. No path, buffer, or stream found."));
            } catch (err) {
                logToFile(`❌ Upload processing error: ${err.message}`);
                console.error("❌ Upload processing error:", err);
                reject(err);
            }
        });
    }

    // AdminJS calls this when you delete a record or explicitly remove an image
    async delete(key, bucket) {
        try {
            await cloudinary.uploader.destroy(`sabjab_admin/${key}`);
        } catch (error) {
            console.error('❌ Cloudinary Delete Error:', error);
        }
    }

    // Provides the Public URL for rendering the image inside the AdminJS List/Show views
    async path(key, bucket) {
        if (!key) return null;
        return `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/sabjab_admin/${key}`;
    }
}

function logToFile(message) {
    try {
        const timestamp = new Date().toISOString();
        fs.appendFileSync('cloudinary_debug.log', `[${timestamp}] ${message}\n`);
    } catch (e) { }
}
