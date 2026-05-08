import { v2 as cloudinary } from 'cloudinary';
import { verifyManager } from "../middleware/auth.js";

export const getMediaLibrary = async (req, reply) => {
    try {
        // Fetch last 100 images from the manager folder
        const result = await cloudinary.search
            .expression('folder:sabjab_manager')
            .sort_by('created_at', 'desc')
            .max_results(100)
            .execute();

        return reply.send({
            success: true,
            resources: result.resources.map(r => ({
                public_id: r.public_id,
                url: r.secure_url,
                created_at: r.created_at,
                format: r.format,
                bytes: r.bytes
            }))
        });
    } catch (error) {
        console.error("Cloudinary list error:", error);
        return reply.code(500).send({ success: false, message: error.message });
    }
};

export const deleteMedia = async (req, reply) => {
    try {
        const { public_id } = req.body;
        if (!public_id) return reply.code(400).send({ message: "public_id required" });

        const result = await cloudinary.uploader.destroy(public_id);
        return reply.send({ success: true, result });
    } catch (error) {
        return reply.code(500).send({ success: false, message: error.message });
    }
};
