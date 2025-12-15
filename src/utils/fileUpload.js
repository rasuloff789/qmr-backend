import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create profile pictures subdirectory
const profilePicturesDir = path.join(uploadsDir, "profile-pictures");
if (!fs.existsSync(profilePicturesDir)) {
	fs.mkdirSync(profilePicturesDir, { recursive: true });
}

// Utility function to delete old profile picture
export const deleteProfilePicture = (filename) => {
	if (!filename) return;

	const filePath = path.join(profilePicturesDir, filename);
	if (fs.existsSync(filePath)) {
		fs.unlinkSync(filePath);
		console.log(`Deleted old profile picture: ${filename}`);
	}
};

// Utility function to get profile picture URL
export const getProfilePictureUrl = (filename) => {
	if (!filename) return null;
	return `/uploads/profile-pictures/${filename}`;
};

// Utility function to process uploaded file from graphql-upload
export const processUploadedFile = async (upload) => {
	if (!upload) {
		return { success: false, error: "No file provided" };
	}

	try {
		// Validate file type (mimetype)
		// Note: Some clients/browsers report PNG as image/x-png.
		const allowedMimeTypes = [
			"image/jpeg",
			"image/jpg",
			"image/pjpeg",
			"image/png",
			"image/x-png",
			"image/gif",
			"image/webp",
		];

		const mimetype = (upload.mimetype || "").toLowerCase();
		if (!mimetype || !allowedMimeTypes.includes(mimetype)) {
			return {
				success: false,
				error: `Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed. Received: ${upload.mimetype}`,
			};
		}

		// Validate file size (5MB limit) - handle missing size
		const maxSize = 5 * 1024 * 1024;
		if (upload.size && upload.size > maxSize) {
			return {
				success: false,
				error: "File too large. Maximum size is 5MB",
			};
		}

		// Generate unique filename - handle missing filename
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		const originalFilename = upload.filename || "upload";
		const originalExt = (path.extname(originalFilename) || "").toLowerCase();

		const mimeToExt = {
			"image/jpeg": ".jpg",
			"image/jpg": ".jpg",
			"image/pjpeg": ".jpg",
			"image/png": ".png",
			"image/x-png": ".png",
			"image/gif": ".gif",
			"image/webp": ".webp",
		};

		// Prefer the original extension only if it matches the allowed type; otherwise use the mimetype-derived extension.
		const desiredExt = mimeToExt[mimetype] || ".bin";
		const isJpeg =
			mimetype === "image/jpeg" ||
			mimetype === "image/jpg" ||
			mimetype === "image/pjpeg";
		const jpegExts = new Set([".jpg", ".jpeg"]);
		const keepOriginalExt =
			(isJpeg && jpegExts.has(originalExt)) || originalExt === desiredExt;
		const ext = keepOriginalExt ? originalExt : desiredExt;
		const filename = `teacher-${uniqueSuffix}${ext}`;
		const filePath = path.join(profilePicturesDir, filename);

		// Create write stream
		const writeStream = fs.createWriteStream(filePath);

		// Pipe the upload stream to the file
		await new Promise((resolve, reject) => {
			upload
				.createReadStream()
				.pipe(writeStream)
				.on("finish", resolve)
				.on("error", reject);
		});

		return {
			success: true,
			filename: filename,
			url: getProfilePictureUrl(filename),
			size: upload.size,
			mimetype: upload.mimetype,
		};
	} catch (error) {
		console.error("Error processing uploaded file:", error);
		return {
			success: false,
			error: "Failed to process uploaded file",
		};
	}
};
