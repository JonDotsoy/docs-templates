import { readFile } from "fs/promises";
import { parse, extname } from "path"
import { ItemReference } from "./types/item-reference";
import { Provider } from "./types/provider";
import { Item } from "./types/item";
import { Content } from "./types/content";
import { createToJson } from "./utils/create-to-json";
import { ControlState } from "./constants/control-state";
import { contentTypes } from "./constants/content-types";
import { parserEngines } from "./constants/parser-engines";
import { GetContent } from "./types/get-content";
import YAML from "yaml"
import { MarkdownParseEngine } from "./engines/markdown-parse-engine";


interface Source {
  url: URL;
  meta: Record<string, any>;
  body: Buffer;
}

interface SourceParsed {
  contentType: string;
  body: any;
}

export class Control {
  state: ControlState = ControlState.Idle;
  private error?: unknown
  private events: Record<string, ((...args: any[]) => any)[] | undefined> = {};

  constructor(readonly provider: Provider) {
    const initPromise = provider.init?.() ?? Promise.resolve();

    initPromise
      .then(() => {
        this.state = ControlState.Ready;
        this.emit('ready');
      })
      .catch(error => {
        this.state = ControlState.Error;
        this.error = error;
        this.emit('error', error);
      });
  }

  async wait(): Promise<void> {
    if (this.state === ControlState.Ready) return;
    if (this.state === ControlState.Error) {
      throw this.error;
    }
    return await new Promise<void>((resolve, reject) => {
      const cb = (err?: unknown) => {
        this.off('ready', cb);
        this.off('error', cb);
        if (err) {
          return reject(err);
        }
        return resolve();
      };
      this.on('ready', cb);
      this.on('error', cb);
    });
  }

  async listItems(): Promise<Array<ItemReference>> {
    await this.wait();
    return this.provider.listItems?.() ?? [];
  }

  private async downloadSource(url: URL): Promise<Source> {
    const protocol = url.protocol;
    let meta: Record<string, any> = {}

    if (protocol === 'file:') {
      const ext = extname(url.pathname).toLowerCase();

      const contentType = contentTypes[ext];

      if (!contentType) throw new Error(`Unsupported file extension: ${ext}`);

      meta['contentType'] = contentType;

      const buffer = await readFile(url);
      return { url, meta, body: buffer }
    };

    throw new Error(`Unsupported protocol: ${protocol}`);
  }

  private async parseDownload({ meta, body }: Source): Promise<SourceParsed> {
    const contentType = meta.contentType;

    if (!contentType) throw new Error('No content type specified');

    if (contentType === "text/markdown") {
      return {
        contentType: "text/markdown",
        body: await MarkdownParseEngine.parse(body),
      }
    }

    if (contentType === "application/x-yaml") {
      const bodyParser = YAML.parse(body.toString());
      const isObject = typeof bodyParser === "object" && bodyParser !== null;
      const withOpneapi = isObject && typeof bodyParser.openapi === 'string';

      if (withOpneapi) {
        return {
          contentType: "application/openapi",
          body: bodyParser,
        }
      }

      throw new Error('Unsupported content to type application/x-yaml');
    }

    throw new Error(`Unsupported content type: ${contentType}`);
  }


  private async parseContent(url: URL, contentType: string, buffer: Buffer): Promise<Content> {
    const ParserEngine = parserEngines[contentType];
    if (!ParserEngine) throw new Error(`Unsupported content type: ${contentType}`);

    return new ParserEngine(url, buffer).toContentNodes();
  }

  private async get(url: URL): Promise<GetContent & { toJSON: Function }> {
    const source = await this.downloadSource(url);
    const response = await this.parseDownload(source);

    return {
      contentType: response.contentType,
      buffer: response.body,
      content: await this.parseContent(url, response.contentType, response.body),
      toJSON: createToJson('contentType', 'content'),
    }
  }

  async selectItem(slug: string[]): Promise<Item | null> {
    await this.wait();
    const itemSelected = await this.provider.selectItem?.(slug) ?? null;
    if (!itemSelected) return null;

    const content = await this.get(itemSelected.url);

    return {
      slug: itemSelected.slug,
      ref: itemSelected,
      content,
    };
  }

  on(eventName: 'ready', listener: (() => void)): void;
  on(eventName: 'error', listener: ((error: unknown) => void)): void;
  on(eventName: string, listener: (...args: any[]) => any) {
    const listeners = this.events[eventName] ?? [];
    listeners.push(listener);
    this.events[eventName] = listeners;
  }

  off(eventName: 'ready', listener: (() => void)): void;
  off(eventName: 'error', listener: ((error: unknown) => void)): void;
  off(eventName: string, listener: (...args: any[]) => any) {
    const listeners = this.events[eventName]?.filter(l => l !== listener) ?? [];
    if (listeners.length) {
      this.events[eventName] = listeners;
    } else {
      const { [eventName]: _, ...nextEvents } = this.events
      this.events = nextEvents;
    }
  }

  private emit(eventName: 'ready'): void;
  private emit(eventName: 'error', error: unknown): void;
  private emit(eventName: string, ...args: any[]) {
    if (this.events[eventName]) {
      this.events[eventName]?.forEach(listener => listener(...args));
      return true;
    }
    return false;
  }
}