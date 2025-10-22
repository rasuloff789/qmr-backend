import checkUser from "../../utils/checkUser.js";

export default async function (_, par, { user }) {
	const Bool = await checkUser(user);
	return Bool;
}
