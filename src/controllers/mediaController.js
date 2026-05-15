import { v2 as cloudinary } from 'cloudinary';

const CLOUDINARY_DELETE_BATCH_SIZE = 100;

const normalizePublicIds = (ids) => {
    const list = Array.isArray(ids) ? ids : [ids];
    return [...new Set(
        list
            .filter(id => typeof id === 'string')
            .map(id => id.trim())
            .filter(Boolean)
    )];
};

const deleteCloudinaryResources = async (publicIds) => {
    const deleted = {};
    const errors = [];

    for (let index = 0; index < publicIds.length; index += CLOUDINARY_DELETE_BATCH_SIZE) {
        const batch = publicIds.slice(index, index + CLOUDINARY_DELETE_BATCH_SIZE);
        try {
            const result = await cloudinary.api.delete_resources(batch, {
                resource_type: 'image',
                invalidate: true,
            });
            Object.assign(deleted, result.deleted || {});
        } catch (error) {
            errors.push({
                public_ids: batch,
                message: error.message,
            });
        }
    }

    return { deleted, errors };
};

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
        const publicIds = normalizePublicIds(req.body?.public_id);
        if (publicIds.length === 0) return reply.code(400).send({ message: "public_id required" });

        const result = await deleteCloudinaryResources(publicIds);
        return reply.send({ success: result.errors.length === 0, result });
    } catch (error) {
        console.error("Media delete error:", error);
        return reply.code(500).send({ success: false, message: error.message });
    }
};

export const bulkDeleteMedia = async (req, reply) => {
    try {
        const publicIds = normalizePublicIds(req.body?.public_ids);
        if (publicIds.length === 0) {
            return reply.code(400).send({ message: "public_ids array required" });
        }

        const result = await deleteCloudinaryResources(publicIds);
        const deletedCount = Object.values(result.deleted).filter(status => status === 'deleted').length;
        
        return reply.send({ 
            success: result.errors.length === 0, 
            result,
            message: `Deleted ${deletedCount} of ${publicIds.length} items`
        });
    } catch (error) {
        console.error("Bulk delete error:", error);
        return reply.code(500).send({ success: false, message: error.message });
    }
};
