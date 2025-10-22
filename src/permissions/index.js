import { rule, shield, allow } from "graphql-shield";
import checkUser from "../utils/checkUser.js";
// import { hasRole } from "../utils/auth.js";

// Rules
const isAuth = rule()(async (_parent, _args, { user }) => {
	return await checkUser(user);
});

// Permissions
export const permissions = shield(
	{
		Query: {
			me: allow,
			"*": isAuth,
		},
		Mutation: {
			"*": isAuth,
			login: allow,
		},
	},
	{ fallbackRule: allow, allowExternalErrors: true }
);
