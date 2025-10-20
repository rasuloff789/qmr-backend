import prisma from "../../config/db.js"; // This imports the Prisma client
import { signToken } from "../../utils/jwt.js";//Function to sign JWT tokens
import { verifyPassword } from "../../utils/hashpswrd.js";

// loginAdmin resolver is used for authenticating admin users

const loginAdmin = async (_parent, { username, password }) => {

  const user = await prisma.admin.findUnique({ where: { username } });

  const loginResponse = {
    "success": false,
    "message": "Incorrect username or password in ADMIN login",
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


  const token = signToken({ id: user.id, role: "ADMIN" });

  loginResponse.success = true;
  loginResponse.message = "You have successfully logged in as ADMIN";
  loginResponse.token = token;
  return loginResponse;  
  };

export { loginAdmin }; 