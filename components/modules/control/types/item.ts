import { ItemReference } from "./item-reference";
import { GetContent } from "./get-content";


export interface Item {
  slug: string[];
  ref: ItemReference;
  content: GetContent;
}
