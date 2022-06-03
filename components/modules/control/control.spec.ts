import { DirProvider } from "./providers/dir-provider"
import { Control } from "./control"
import { ContentNode } from "./types/content-node";
import { pathToFileURL } from "url"
import { inspect } from "util";


describe('control', () => {
  it('should creat control and list items', async () => {
    const dirProvider = new DirProvider(new URL(pathToFileURL(`${__dirname}/_control.spec.dir-sample/`)));
    const control = new Control(dirProvider);

    const items = await control.listItems();

    expect(items).toHaveLength(2)
  });

  describe('Select item', () => {
    let control: Control;
    let dirProvider: DirProvider;

    beforeAll(async () => {
      dirProvider = new DirProvider(new URL(pathToFileURL(`${__dirname}/_control.spec.dir-sample/`)));
      control = new Control(dirProvider);
    });

    it('should parse md file', async () => {
      const item = await control.selectItem(['a'])

      expect(item).not.toBeNull()

      expect(item!.content.content.tableContent).toEqual([
        { id: '20-45-hola-12-a-b', title: 'Hola 12 a b' },
      ])

      const findNode = (node: ContentNode, id: string): ContentNode | null => {
        if (node.id === id) return node
        if (node.children) {
          for (const child of node.children) {
            const found = findNode(child, id)
            if (found) return found
          }
        }
        return null
      }

      const itemLink = findNode(item!.content.content.body, '63-76-b')

      expect(itemLink).not.toBeNull()
    });

    it('should parse yaml file', async () => {
      const item = await control.selectItem(['b'])

      
    });

  });

});

export { }

