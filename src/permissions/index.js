import { rule, shield, allow } from "graphql-shield";
// import { hasRole } from "../utils/auth.js";

// Rules
const isAuth = rule()((_parent, _args, ctx) => !!ctx.user);

// Permissions
export const permissions = shield(
	{
		Query: {
			loginRoot: allow,
			loginAdmin: allow,
			"*": isAuth,
			// users: isAuth,
		},
		Mutation: {
			"*": isAuth,
		},
	},
	{ fallbackRule: allow, allowExternalErrors: true }
);
