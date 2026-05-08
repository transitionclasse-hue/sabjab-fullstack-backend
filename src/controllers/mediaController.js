import { v2 as cloudinary } from 'cloudinary';

export const getMediaLibrary = async (req, reply) => {
    try {
        const { folder } = req.query;
        
        // Default to manager folder if not specified
        const searchFolder = folder || 'sabjab_manager';
        
        // Fetch images from the specified folder (default 100)
        const result = await cloudinary.search
            .expression(`folder:${searchFolder}`)
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

export const bulkDeleteMedia = async (req, reply) => {
    try {
        const { public_ids } = req.body;
        if (!Array.isArray(public_ids) || public_ids.length === 0) {
            return reply.code(400).send({ message: "public_ids array required" });
        }

        // Cloudinary API supports bulk deletion (up to 100 at once)
        const result = await cloudinary.api.delete_resources(public_ids);
        
        return reply.send({ 
            success: true, 
            result,
            message: `Successfully deleted ${public_ids.length} items`
        });
    } catch (error) {
        console.error("Bulk delete error:", error);
        return reply.code(500).send({ success: false, message: error.message });
    }
};
