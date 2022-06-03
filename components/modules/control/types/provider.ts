import { ItemReference } from "./item-reference";


export interface Provider {
  init?(): Promise<void>;
  listItems?(): Promise<Array<ItemReference>>;
  selectItem?(slug: string[]): Promise<{ url: URL; slug: string[]; } | null>;
}
