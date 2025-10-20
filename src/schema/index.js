import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { gql } from "graphql-tag";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootTypeDefs = fs.readFileSync(path.join(__dirname, "root.gql"), "utf8");
const loginTypeDefs = fs.readFileSync(path.join(__dirname, "login.gql"), "utf8");
const adminTypeDefs = fs.readFileSync(path.join(__dirname, "admin.gql"), "utf8");
const scalarTypeDefs = fs.readFileSync(path.join(__dirname, "scalar.gql"), "utf8");

export const schema = gql`
${rootTypeDefs}
${loginTypeDefs}
${adminTypeDefs}
${scalarTypeDefs}
`;