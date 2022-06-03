import { Content } from "./content";


export interface ParseEngine {
  new(url: URL, payload: any): ParseEngineInstance;
}


export abstract class ParseEngineInstance {
  abstract toContentNodes(): Promise<Content>;
}
