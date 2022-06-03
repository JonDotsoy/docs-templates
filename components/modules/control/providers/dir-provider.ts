
import path, { sep } from "path";
import fs, { stat } from "fs/promises";
import { fileURLToPath, pathToFileURL } from "url";
import { Provider } from "../types/provider";
import { ItemReference } from "../types/item-reference";

const eqArr = (arr1: any[], arr2: any[]) => arr1.length === arr2.length && arr1.every((v, i) => v === arr2[i]);

async function* readDocsFolder(baseDir: string): AsyncGenerator<{ slug: string[], ext: string }> {
  const items = await fs.readdir(baseDir, { withFileTypes: true });

  for (const item of items) {
    if (item.isFile()) {
      const itemParsed = path.parse(item.name);
      if (!['.md', '.yaml'].includes(itemParsed.ext)) continue;
      const slug = itemParsed.name;
      yield { slug: [slug], ext: itemParsed.ext };
    }
    if (item.isDirectory()) {
      const slugs = readDocsFolder(path.join(baseDir, item.name));
      for await (const slug of slugs) {
        yield {
          slug: [item.name, ...slug.slug],
          ext: slug.ext,
        };
      }
    }
  }
}


export class DirProvider implements Provider {
  private itemsStored?: ItemReference[];

  constructor(private url: URL) { }

  async init() {
    const items: ItemReference[] = [];

    if (!(await stat(this.url)).isDirectory()) {
      throw new Error(`${this.url} is not a directory`);
    }

    const basePath = fileURLToPath(this.url)

    for await (const slug of readDocsFolder(basePath)) {
      items.push({
        slug: [...slug.slug],
        url: pathToFileURL(`${basePath}/${slug.slug.join(sep)}${slug.ext}`),
      });
    }

    this.itemsStored = items;
  }

  async listItems(): Promise<Array<ItemReference>> {
    return this.itemsStored ?? [];
  }

  async selectItem(slug: string[]): Promise<ItemReference | null> {
    const valueSlug = this.itemsStored?.find(v => eqArr(v.slug, slug));

    return valueSlug ?? null;
  }
}
