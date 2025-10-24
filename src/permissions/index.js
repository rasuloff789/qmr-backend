import { rule, shield, allow, deny } from "graphql-shield";
import checkUser from "../utils/checkUser.js";

/**
 * Authentication rule - checks if user is authenticated and valid
 */
const isAuth = rule()(async (_parent, _args, { user }) => {
	if (!user) {
		return false;
	}
	return await checkUser(user);
});

/**
 * Root-only rule - checks if user is root
 */
const isRoot = rule()(async (_parent, _args, { user }) => {
	if (!user || user.role !== "root") {
		return false;
	}
	return await checkUser(user);
});

/**
 * Admin or Root rule - checks if user is admin or root
 */
const isAdminOrRoot = rule()(async (_parent, _args, { user }) => {
	if (!user || !["admin", "root"].includes(user.role)) {
		return false;
	}
	return await checkUser(user);
});

// Permissions configuration
export const permissions = shield(
	{
		Query: {
			me: isAuth,
			getAdmins: isAdminOrRoot,
			getAdmin: isAdminOrRoot,
		},
		Mutation: {
			login: allow, // Public access for login
			addAdmin: isRoot, // Only root can add admins
		},
	},
	{
		fallbackRule: deny, // Deny by default
		allowExternalErrors: true,
		debug: process.env.NODE_ENV === "development",
	}
);
