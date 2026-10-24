import { defineConfig } from "drizzle-kit";
import { mysqlUrl } from "./src/db/config";

/**
 * Drizzle Kit config — connection details come from `src/db/config.ts`,
 * so there is a single source of truth (host, user, password, database).
 */
export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: mysqlUrl(),
  },
});
