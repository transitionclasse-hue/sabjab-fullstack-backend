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
            // 1. Try deleting as images (most common)
            console.log(`📤 Deleting batch of ${batch.length} resources [Attempt 1: image]`);
            const imgResult = await cloudinary.api.delete_resources(batch, {
                resource_type: 'image',
                invalidate: true,
            });
            Object.assign(deleted, imgResult.deleted || {});

            // 2. Identify those that were not found (could be video or raw)
            const notFound = batch.filter(id => deleted[id] === 'not_found');
            
            if (notFound.length > 0) {
                console.log(`⚠️ ${notFound.length} resources not found as image. Retrying as video/raw...`);
                
                // Try as video
                const vidResult = await cloudinary.api.delete_resources(notFound, {
                    resource_type: 'video',
                    invalidate: true,
                });
                Object.assign(deleted, vidResult.deleted || {});

                // Still not found? Try as raw
                const remainingNotFound = notFound.filter(id => deleted[id] === 'not_found');
                if (remainingNotFound.length > 0) {
                    const rawResult = await cloudinary.api.delete_resources(remainingNotFound, {
                        resource_type: 'raw',
                        invalidate: true,
                    });
                    Object.assign(deleted, rawResult.deleted || {});
                }
            }
        } catch (error) {
            console.error(`❌ Cloudinary Delete Error:`, error.message);
            errors.push({
                public_ids: batch,
                message: error.message,
            });
        }
    }

    console.log(`✅ Deletion Summary: ${Object.keys(deleted).length} processed`);
    return { deleted, errors };
};

export const getMediaLibrary = async (req, reply) => {
    try {
        const { folder } = req.query;
        
        // Default to manager folder if not specified
        const searchFolder = folder || 'sabjab_manager';
        console.log(`🔍 Fetching media library for folder: "${searchFolder}"`);
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
                bytes: r.bytes,
                resource_type: r.resource_type || 'image'
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
    console.log("🚀 BULK DELETE CALLED - Body:", JSON.stringify(req.body));
    try {
        const publicIds = normalizePublicIds(req.body?.public_ids);
        if (publicIds.length === 0) {
            return reply.code(400).send({ message: "public_ids array required" });
        }

        const result = await deleteCloudinaryResources(publicIds);
        
        // Count actual deletions
        const deletedEntries = Object.entries(result.deleted);
        const deletedCount = deletedEntries.filter(([_, status]) => status === 'deleted').length;
        const notFoundCount = deletedEntries.filter(([_, status]) => status === 'not_found').length;

        console.log(`📊 Bulk Delete Results: ${deletedCount} deleted, ${notFoundCount} not found, ${result.errors.length} batch errors`);

        return reply.send({ 
            success: result.errors.length === 0, 
            result,
            message: `Deleted ${deletedCount} items. ${notFoundCount > 0 ? `${notFoundCount} were not found.` : ''}`
        });
    } catch (error) {
        console.error("Bulk delete error:", error);
        return reply.code(500).send({ success: false, message: error.message });
    }
};
