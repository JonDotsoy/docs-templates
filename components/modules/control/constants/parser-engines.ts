import { ParseEngine } from "../types/parse-engine";
import { MarkdownParseEngine } from "../engines/markdown-parse-engine";
import { OpenApiEngine } from "../engines/openapi-engine";

export const parserEngines: Record<string, ParseEngine> = {
  'text/markdown': MarkdownParseEngine,
  'application/openapi': OpenApiEngine,
};
