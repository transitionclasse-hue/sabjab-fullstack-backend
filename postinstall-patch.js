/**
 * postinstall-patch.js
 * 
 * Patches @adminjs/fastify's buildRouter.js to fix file upload compatibility
 * with @adminjs/upload v4.
 * 
 * ROOT CAUSE: @adminjs/fastify's original getFile() returns a raw ReadableStream,
 * but @adminjs/upload expects File-like objects in an ARRAY (checks files.length).
 * Also, the stream is consumed internally by Fastify, so toBuffer()/manual read gets 0 bytes.
 * Additionally, browser sends files as "uploadFile.0" (indexed), not "uploadFile".
 * 
 * FIX: Use onFile handler to buffer files BEFORE route handler, then convert
 * file fields to File-like objects (arrays for direct keys, objects for indexed keys).
 * 
 * Run: node postinstall-patch.js (or auto-runs via "postinstall" in package.json)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.join(__dirname, 'node_modules', '@adminjs', 'fastify', 'lib', 'buildRouter.js');

const patchedContent = `import fastifyMultipart from '@fastify/multipart';
import { Router as AdminRouter } from 'adminjs';
import { readFile } from 'fs/promises';
import fromPairs from 'lodash/fromPairs.js';
import * as mime from 'mime-types';
import path from 'path';
import { WrongArgumentError } from './errors.js';
import { log } from './logger.js';
const INVALID_ADMIN_JS_INSTANCE = 'You have to pass an instance of AdminJS to the buildRouter() function';

export const buildRouter = async (admin, fastifyApp) => {
    const { assets } = AdminRouter;
    if (admin?.constructor?.name !== 'AdminJS') {
        throw new WrongArgumentError(INVALID_ADMIN_JS_INSTANCE);
    }

    // PATCHED: Encapsulate the admin router in its own Fastify context
    // to prevent fastifyMultipart from leaking globally and crashing the app.
    await fastifyApp.register(async (adminInstance) => {
        // PATCHED: Use onFile handler to buffer file data BEFORE the route handler runs
        await adminInstance.register(fastifyMultipart, {
            attachFieldsToBody: true,
            onFile: async (part) => {
                const chunks = [];
                for await (const chunk of part.file) {
                    chunks.push(chunk);
                }
                part._buf = Buffer.concat(chunks);
                part.toBuffer = async () => part._buf;
            }
        });

        admin.initialize().then(() => {
            log.debug('AdminJS: bundle ready');
        });

        const { routes } = AdminRouter;
        routes.forEach(route => {
            const path = route.path.replace(/{/g, ':').replace(/}/g, '');
            const handler = async (request, reply) => {
                const controller = new route.Controller({ admin }, request.session?.adminUser);
                const { params, query } = request;
                const method = request.method.toLowerCase();
                const body = request.body;

                // PATCHED: Convert file fields to File-like objects.
                const entries = await Promise.all(
                    Object.keys((body ?? {})).map(async (key) => {
                        const field = body[key];
                        if (field && field.file !== undefined && field.filename) {
                            const buffer = field._buf || null;
                            if (!buffer || buffer.length === 0) {
                                return [key, null];
                            }
                            const fileObj = {
                                name: field.filename,
                                buffer: buffer,
                                size: buffer.length,
                                type: field.mimetype,
                                encoding: field.encoding,
                            };
                            if (/\\.\\d+$/.test(key)) {
                                return [key, fileObj];
                            } else {
                                return [key, [fileObj]];
                            }
                        }
                        return [key, field?.value ?? field];
                    })
                );
                const fields = fromPairs(entries);

                const html = await controller[route.action]({
                    ...request,
                    params,
                    query,
                    payload: fields ?? {},
                    method,
                }, reply);
                if (route.contentType) {
                    reply.type(route.contentType);
                }
                else if (typeof html === 'string') {
                    reply.type('text/html');
                }
                if (html) {
                    return reply.send(html);
                }
            };
            if (route.method === 'GET') {
                adminInstance.get(\`\${admin.options.rootPath}\${path}\`, handler);
            }
            if (route.method === 'POST') {
                adminInstance.post(\`\${admin.options.rootPath}\${path}\`, handler);
            }
        });
        assets.forEach(asset => {
            adminInstance.get(\`\${admin.options.rootPath}\${asset.path}\`, async (_req, reply) => {
                const mimeType = mime.lookup(asset.src);
                const file = await readFile(path.resolve(asset.src));
                if (mimeType) {
                    return reply.type(mimeType).send(file);
                }
                return reply.send(file);
            });
        });
    });
};
`

try {
    fs.writeFileSync(targetFile, patchedContent, 'utf8');
    console.log('✅ Patched @adminjs/fastify buildRouter.js for file upload compatibility');
} catch (err) {
    console.error('❌ Failed to patch @adminjs/fastify:', err.message);
}
