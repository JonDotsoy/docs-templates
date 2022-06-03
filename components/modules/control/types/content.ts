import { ContentNode } from "./content-node";
import { ItemTableContent } from "../../../types/item-table-content";


export interface Content {
  tableContent: ItemTableContent[];
  body: ContentNode;
}
