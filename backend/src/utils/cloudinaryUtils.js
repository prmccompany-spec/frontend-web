import cloudinary from '../config/cloudinary.js';

export const uploadBuffer = (buffer, { folder, public_id, resource_type = 'auto' }) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id, resource_type, overwrite: true },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

// Matches URLs Cloudinary returns as `secure_url`, e.g.
// https://res.cloudinary.com/<cloud>/image/upload/v1234567890/org/members/member_5_123.png
const CLOUDINARY_URL_RE =
  /^https?:\/\/res\.cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;

// Silently no-ops on legacy local-disk paths (pre-migration rows) — there's
// nothing in Cloudinary to clean up for those.
export const deleteByUrl = async (url) => {
  if (!url) return;
  const match = CLOUDINARY_URL_RE.exec(url);
  if (!match) return;
  const [, resourceType, publicId] = match;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('Cloudinary cleanup failed:', error.message);
  }
};
