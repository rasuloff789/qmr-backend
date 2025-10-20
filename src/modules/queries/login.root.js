import prisma from "../../config/db.js"; // This imports the Prisma client
import { signToken } from "../../utils/jwt.js";//Function to sign JWT tokens
import { verifyPassword } from "../../utils/hashpswrd.js";

// loginRoot resolver is used for authenticating root users

const loginRoot = async (_parent, { username, password }) => {

  const user = await prisma.root.findUnique({ where: { username } });

  const loginResponse = {
    "success": false,
    "message": "Incorrect username or password in ROOT login",
    "token": null,
  };

  if (!user) {
    return loginResponse
  } else{
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return loginResponse
    }
  }


  const token = signToken({ id: user.id, role: "ROOT" });

  loginResponse.success = true;
  loginResponse.message = "You have successfully logged in as ROOT";
  loginResponse.token = token;
  return loginResponse;  
  };

export { loginRoot }; 