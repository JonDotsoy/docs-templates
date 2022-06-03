import { Content } from "./content";


export interface GetContent {
  contentType: string;
  buffer: Buffer;
  content: Content;
}
