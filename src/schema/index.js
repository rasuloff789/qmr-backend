import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { gql } from "graphql-tag";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootTypeDefs = fs.readFileSync(path.join(__dirname, "root.gql"), "utf8");

export const schema = gql`
${rootTypeDefs}
`;