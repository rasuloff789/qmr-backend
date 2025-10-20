import * as Query from "./queries/index.js";
import * as Mutation from "./mutations/index.js";

export default {
  Query: {
    ...Query,
  },
  Mutation: {
    ...Mutation,
  },
};