import { processUploadedFile } from "../../../utils/fileUpload.js";

/**
 * Test File Upload Resolver
 * Simple mutation to test file upload functionality
 */
export const testFileUpload = async (_parent, args, context) => {
	const { file } = args;
	const { user } = context;

	console.log("🧪 testFileUpload mutation called");
	console.log("👤 User:", {
		id: user?.id,
		username: user?.username,
		role: user?.role,
	});

	try {
		// Check if file is provided
		if (!file) {
			return {
				success: false,
				message: "No file provided",
				fileUrl: null,
				errors: ["File is required"],
				timestamp: new Date().toISOString(),
			};
		}

		// Await the file object as per Apollo Server v3 documentation
		const fileData = await file;

		// Process the uploaded file
		const uploadResult = await processUploadedFile(fileData);

		if (!uploadResult.success) {
			return {
				success: false,
				message: "File upload failed",
				fileUrl: null,
				errors: [uploadResult.error],
				timestamp: new Date().toISOString(),
			};
		}

		return {
			success: true,
			message: "File uploaded successfully",
			fileUrl: uploadResult.url,
			filename: uploadResult.filename,
			size: uploadResult.size,
			mimetype: uploadResult.mimetype,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("❌ Test file upload error:", error);
		return {
			success: false,
			message: "File upload failed due to server error",
			fileUrl: null,
			errors: [error.message || "Unknown error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};
