import prisma from "../../config/db.js"; // This imports the Prisma client

// loginRoot resolver is used for authenticating root users

const loginRoot = async (_parent, { username, password }) => {
    const user = await prisma.root.findUnique({ where: { username } });
    console.log(user);
    if (!user || user.password !== password) {
      throw new Error("Invalid credentials");
    }
    return "user";  
  };

 export { loginRoot }; 