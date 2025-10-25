/**
 * Firebase SMS Utility
 * Handles sending SMS messages using Firebase Admin SDK
 */

import admin from "firebase-admin";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Initialize Firebase Admin SDK
let firebaseApp = null;

const initializeFirebase = () => {
	if (!firebaseApp) {
		try {
			// Initialize Firebase Admin SDK
			// Note: In production, you should use environment variables for the service account
			// For now, we'll use the default credentials or a service account file
			firebaseApp = admin.initializeApp({
				credential: admin.credential.applicationDefault(),
				// You can also use a service account file:
				// credential: admin.credential.cert(require('./path/to/serviceAccountKey.json')),
			});
		} catch (error) {
			console.error("Firebase initialization error:", error);
			throw new Error("Failed to initialize Firebase");
		}
	}
	return firebaseApp;
};

/**
 * Generate a 6-digit verification code
 * @returns {string} - 6-digit verification code
 */
export const generateVerificationCode = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store verification code in database with expiration
 * @param {string} username - Username
 * @param {string} userType - User type (root, admin, teacher)
 * @param {string} code - Verification code
 * @param {string} phone - Phone number
 * @returns {Promise<Object>} - Database record
 */
export const storeVerificationCode = async (
	username,
	userType,
	code,
	phone
) => {
	try {
		// Store verification code with 10-minute expiration
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

		const verificationRecord = await prisma.verificationCode.create({
			data: {
				username,
				userType,
				code,
				phone,
				expiresAt,
				isUsed: false,
			},
		});

		return verificationRecord;
	} catch (error) {
		console.error("Error storing verification code:", error);
		throw new Error("Failed to store verification code");
	}
};

/**
 * Verify and consume verification code
 * @param {string} username - Username
 * @param {string} userType - User type
 * @param {string} code - Verification code
 * @returns {Promise<Object>} - Verification record if valid
 */
export const verifyAndConsumeCode = async (username, userType, code) => {
	try {
		const verificationRecord = await prisma.verificationCode.findFirst({
			where: {
				username,
				userType,
				code,
				isUsed: false,
				expiresAt: {
					gt: new Date(), // Not expired
				},
			},
		});

		if (!verificationRecord) {
			return null;
		}

		// Mark code as used
		await prisma.verificationCode.update({
			where: { id: verificationRecord.id },
			data: { isUsed: true },
		});

		return verificationRecord;
	} catch (error) {
		console.error("Error verifying code:", error);
		throw new Error("Failed to verify code");
	}
};

/**
 * Send SMS using Firebase (simulated for development)
 * In production, you would use Firebase Cloud Messaging or a real SMS service
 * @param {string} phone - Phone number
 * @param {string} message - SMS message
 * @returns {Promise<boolean>} - Success status
 */
export const sendSMS = async (phone, message) => {
	try {
		// Initialize Firebase if not already done
		initializeFirebase();

		// For development/testing purposes, we'll simulate SMS sending
		// In production, you would integrate with a real SMS service like Twilio, AWS SNS, etc.
		console.log(`📱 SMS Simulation - To: ${phone}`);
		console.log(`📱 Message: ${message}`);
		console.log(
			"📱 Note: In production, this would send a real SMS via Firebase or SMS service"
		);

		// Simulate successful SMS sending
		return true;
	} catch (error) {
		console.error("SMS sending error:", error);
		throw new Error("Failed to send SMS");
	}
};

/**
 * Send verification code via SMS
 * @param {string} username - Username
 * @param {string} userType - User type
 * @param {string} phone - Phone number
 * @returns {Promise<Object>} - Result object
 */
export const sendVerificationCode = async (username, userType, phone) => {
	try {
		// Generate verification code
		const code = generateVerificationCode();

		// Store verification code in database
		await storeVerificationCode(username, userType, code, phone);

		// Create SMS message
		const message = `Your QMR verification code is: ${code}. This code expires in 10 minutes. Do not share this code with anyone.`;

		// Send SMS
		await sendSMS(phone, message);

		return {
			success: true,
			code, // In development, we return the code for testing
			message: "Verification code sent successfully",
		};
	} catch (error) {
		console.error("Error sending verification code:", error);
		return {
			success: false,
			error: error.message,
		};
	}
};

/**
 * Clean up expired verification codes
 * This should be called periodically to clean up old codes
 */
export const cleanupExpiredCodes = async () => {
	try {
		const result = await prisma.verificationCode.deleteMany({
			where: {
				OR: [
					{ expiresAt: { lt: new Date() } }, // Expired codes
					{ isUsed: true }, // Used codes
				],
			},
		});

		console.log(`Cleaned up ${result.count} expired/used verification codes`);
		return result.count;
	} catch (error) {
		console.error("Error cleaning up codes:", error);
		throw new Error("Failed to cleanup expired codes");
	}
};
