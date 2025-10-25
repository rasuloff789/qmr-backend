/**
 * Firebase Authentication Middleware
 * Handles Firebase ID token verification for GraphQL requests
 */

import { verifyFirebaseToken } from "../utils/firebase/auth.js";

/**
 * Extract Firebase ID token from request headers
 * @param {Object} req - Express request object
 * @returns {string|null} - Firebase ID token or null
 */
const extractFirebaseToken = (req) => {
	// Check for Firebase ID token in Authorization header
	const authHeader = req.headers.authorization;
	
	if (authHeader && authHeader.startsWith("Bearer ")) {
		const token = authHeader.split(" ")[1];
		// Firebase ID tokens are typically longer than JWT tokens
		// and start with different patterns
		if (token && token.length > 100) {
			return token;
		}
	}
	
	// Check for Firebase ID token in custom header
	const firebaseToken = req.headers["x-firebase-token"];
	if (firebaseToken) {
		return firebaseToken;
	}
	
	return null;
};

/**
 * Firebase authentication middleware
 * Verifies Firebase ID token and adds user to context
 */
export const firebaseAuthMiddleware = async (req, res, next) => {
	try {
		const firebaseToken = extractFirebaseToken(req);
		
		if (!firebaseToken) {
			// No Firebase token provided - user is not authenticated
			req.user = null;
			req.firebaseUser = null;
			return next();
		}
		
		// Verify Firebase ID token
		const verificationResult = await verifyFirebaseToken(firebaseToken);
		
		if (verificationResult.success) {
			req.firebaseUser = verificationResult.user;
			
			// Extract our system user information from custom claims
			const { username, userType } = verificationResult.user.customClaims || {};
			
			if (username && userType) {
				// User is linked to our system
				req.user = {
					id: verificationResult.user.uid,
					username,
					role: userType,
					firebaseUid: verificationResult.user.uid,
					phone: verificationResult.user.phone,
					email: verificationResult.user.email,
					phoneVerified: verificationResult.user.phoneVerified,
					emailVerified: verificationResult.user.emailVerified,
				};
			} else {
				// Firebase user but not linked to our system
				req.user = {
					id: verificationResult.user.uid,
					username: null,
					role: null,
					firebaseUid: verificationResult.user.uid,
					phone: verificationResult.user.phone,
					email: verificationResult.user.email,
					phoneVerified: verificationResult.user.phoneVerified,
					emailVerified: verificationResult.user.emailVerified,
				};
			}
			
			console.log("✅ Firebase user authenticated:", {
				uid: req.user.firebaseUid,
				username: req.user.username,
				role: req.user.role,
				phone: req.user.phone,
				phoneVerified: req.user.phoneVerified,
			});
		} else {
			console.warn("❌ Firebase token verification failed:", verificationResult.error);
			req.user = null;
			req.firebaseUser = null;
		}
		
		next();
	} catch (error) {
		console.error("❌ Firebase auth middleware error:", error);
		req.user = null;
		req.firebaseUser = null;
		next();
	}
};

/**
 * Require Firebase authentication
 * Middleware that requires a valid Firebase user
 */
export const requireFirebaseAuth = (req, res, next) => {
	if (!req.firebaseUser) {
		return res.status(401).json({
			success: false,
			message: "Firebase authentication required",
			error: "No valid Firebase ID token provided",
		});
	}
	next();
};

/**
 * Require linked system user
 * Middleware that requires a Firebase user linked to our system
 */
export const requireLinkedUser = (req, res, next) => {
	if (!req.user || !req.user.username || !req.user.role) {
		return res.status(401).json({
			success: false,
			message: "User not linked to system",
			error: "Firebase user must be linked to a system account",
		});
	}
	next();
};
