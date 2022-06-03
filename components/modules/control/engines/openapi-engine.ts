import { ParseEngineInstance } from "../types/parse-engine";
import { Content } from "../types/content";

export class OpenApiEngine extends ParseEngineInstance {
  constructor(private url: URL, private object: any) {
    super();
  }

  toContentNodes(): Promise<Content> {
    throw new Error("Method not implemented.");
  }
}
