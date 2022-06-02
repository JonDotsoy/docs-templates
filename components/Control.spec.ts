import { DirProvider } from "./DirProvider"
import { Control } from "./Control"
import { pathToFileURL } from "url"
import { inspect } from "util";


describe('control', () => {
  it('should creat control and list items', async () => {
    const dirProvider = new DirProvider(new URL(pathToFileURL(`${__dirname}/_control_sample/`)));
    const control = new Control(dirProvider);

    const items = await control.listItems();

    expect(items).toHaveLength(2)
  });

  describe('Select item', () => {
    let control: Control;
    let dirProvider: DirProvider;

    beforeAll(async () => {
      dirProvider = new DirProvider(new URL(pathToFileURL(`${__dirname}/_control_sample/`)));
      control = new Control(dirProvider);
    });

    it('should item parse md files', async () => {
      const item = await control.selectItem(['a'])

      expect(item).not.toBeNull()

      console.log(inspect(item, { depth: null }))
    });

  });

});

export { }

