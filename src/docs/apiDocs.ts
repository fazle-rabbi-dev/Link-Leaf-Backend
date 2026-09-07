import { readFileSync } from "node:fs";
import { parse } from "yaml";

const specUrl = new URL("../../openapi.yaml", import.meta.url);

const rawSpec = readFileSync(specUrl, "utf-8");
export const swaggerSpec = parse(rawSpec);
