import jwt from "jsonwebtoken";
import config from "../config/env.js";

export function signToken(payload) {
	return jwt.sign(payload, config.JWT_SECRET, {
		expiresIn: config.JWT_EXPIRES_IN,
		issuer: "qmr-backend",
		audience: "qmr-frontend",
	});
}

export function verifyToken(token) {
	try {
		return jwt.verify(token, config.JWT_SECRET, {
			issuer: "qmr-backend",
			audience: "qmr-frontend",
		});
	} catch (error) {
		throw new Error("Invalid or expired token");
	}
}

export function decodeToken(token) {
	try {
		return jwt.decode(token);
	} catch (error) {
		return null;
	}
}
