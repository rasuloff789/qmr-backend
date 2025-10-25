/**
 * Firebase Authentication Utility
 * Handles Firebase ID token verification and user authentication
 */

import admin from "firebase-admin";

// Initialize Firebase Admin SDK
let firebaseApp = null;

const initializeFirebase = () => {
	if (!firebaseApp) {
		try {
			// Initialize Firebase Admin SDK
			// In production, use environment variables for service account
			firebaseApp = admin.initializeApp({
				credential: admin.credential.applicationDefault(),
				// Alternative: credential: admin.credential.cert(require('./path/to/serviceAccountKey.json')),
			});
		} catch (error) {
			console.error("Firebase initialization error:", error);
			throw new Error("Failed to initialize Firebase");
		}
	}
	return firebaseApp;
};

/**
 * Verify Firebase ID token and extract user information
 * @param {string} idToken - Firebase ID token from frontend
 * @returns {Promise<Object>} - Decoded token with user information
 */
export const verifyFirebaseToken = async (idToken) => {
	try {
		// Initialize Firebase if not already done
		initializeFirebase();

		// Verify the ID token
		const decodedToken = await admin.auth().verifyIdToken(idToken);
		
		console.log("✅ Firebase token verified successfully:", {
			uid: decodedToken.uid,
			phone: decodedToken.phone_number,
			email: decodedToken.email,
			emailVerified: decodedToken.email_verified,
			phoneVerified: decodedToken.phone_number_verified,
		});

		return {
			success: true,
			user: {
				uid: decodedToken.uid,
				phone: decodedToken.phone_number,
				email: decodedToken.email,
				emailVerified: decodedToken.email_verified,
				phoneVerified: decodedToken.phone_number_verified,
				// Additional claims if needed
				customClaims: decodedToken.custom_claims || {},
			},
		};
	} catch (error) {
		console.error("❌ Firebase token verification failed:", error.message);
		return {
			success: false,
			error: error.message,
		};
	}
};

/**
 * Create custom claims for user roles
 * @param {string} uid - Firebase user UID
 * @param {Object} claims - Custom claims to set
 * @returns {Promise<boolean>} - Success status
 */
export const setCustomClaims = async (uid, claims) => {
	try {
		initializeFirebase();
		
		await admin.auth().setCustomUserClaims(uid, claims);
		console.log(`✅ Custom claims set for user ${uid}:`, claims);
		return true;
	} catch (error) {
		console.error("❌ Failed to set custom claims:", error.message);
		return false;
	}
};

/**
 * Get user information from Firebase UID
 * @param {string} uid - Firebase user UID
 * @returns {Promise<Object>} - User information
 */
export const getFirebaseUser = async (uid) => {
	try {
		initializeFirebase();
		
		const userRecord = await admin.auth().getUser(uid);
		return {
			success: true,
			user: {
				uid: userRecord.uid,
				phone: userRecord.phoneNumber,
				email: userRecord.email,
				emailVerified: userRecord.emailVerified,
				phoneVerified: userRecord.phoneNumberVerified,
				customClaims: userRecord.customClaims || {},
				disabled: userRecord.disabled,
				createdAt: userRecord.metadata.creationTime,
				lastSignIn: userRecord.metadata.lastSignInTime,
			},
		};
	} catch (error) {
		console.error("❌ Failed to get Firebase user:", error.message);
		return {
			success: false,
			error: error.message,
		};
	}
};

/**
 * Link Firebase user to our database user
 * @param {string} firebaseUid - Firebase user UID
 * @param {string} username - Our system username
 * @param {string} userType - User type (root, admin, teacher)
 * @returns {Promise<Object>} - Link result
 */
export const linkFirebaseUser = async (firebaseUid, username, userType) => {
	try {
		// Set custom claims to link Firebase user to our system
		const claims = {
			username,
			userType,
			linkedAt: new Date().toISOString(),
		};

		const success = await setCustomClaims(firebaseUid, claims);
		
		if (success) {
			return {
				success: true,
				message: "Firebase user linked successfully",
				claims,
			};
		} else {
			return {
				success: false,
				message: "Failed to link Firebase user",
			};
		}
	} catch (error) {
		console.error("❌ Failed to link Firebase user:", error.message);
		return {
			success: false,
			message: "Failed to link Firebase user",
			error: error.message,
		};
	}
};
