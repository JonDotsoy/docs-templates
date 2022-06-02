import { readFile } from "fs/promises";
import { parse } from "path"
import * as markdownToAst from "@textlint/markdown-to-ast"
import yaml from "yaml"
import { TxtNode } from "@textlint/ast-node-types";
import { title } from "process";

export enum ControlState {
  Idle,
  Loading,
  Error,
  Ready,
}

export interface ItemReference {
  url: URL;
  slug: string[];
}

export interface Provider {
  init?(): Promise<void>;
  listItems?(): Promise<Array<ItemReference>>;
  selectItem?(slug: string[]): Promise<{ url: URL, slug: string[] } | null>;
}

interface Item {
  slug: string[];
  ref: ItemReference;
  content: {
    contentType: string;
    buffer: Buffer;
    content: Content;
  };
}

export interface ContentNode {
  id: string;
  type: string
  value?: string
  title?: string
  url?: string
  alt?: string
  children?: ContentNode[]
}

export interface ItemTableContent {
  id: string;
  title: string;
  // node: ContentNode;
  // items: ItemTableContent[];
}

export interface Content {
  tableContent: ItemTableContent[]
  body: ContentNode
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

  private async getBuffer(url: URL) {
    const protocol = url.protocol;

    if (protocol === 'file:') return readFile(url);
    // if (protocol === 'http:') return fetch(url.href).s;
    // if (protocol === 'https:') return fetch(url.href);

    throw new Error(`Unsupported protocol: ${protocol}`);
  }

  private toContentType(url: URL) {
    const pathName = url.pathname;
    const ext = parse(pathName).ext.toLowerCase();

    if (['.md'].includes(ext)) return 'text/markdown';
    if (['.yml', '.yaml'].includes(ext)) return 'text/yaml';

    throw new Error(`Unsupported content type: ${ext}`);
  }

  private async parseMarkdownContent(buffer: Buffer): Promise<Content> {
    const node = markdownToAst.parse(buffer.toString());

    const tableContent: ItemTableContent[] = [];

    const txtNodeToStr = (node: TxtNode): string => {
      if (typeof node.value === 'string') return node.value;
      if (Array.isArray(node.children)) return node.children.map(txtNodeToStr).join('');
      return ``
    }

    const p = (node: TxtNode): ContentNode => {
      const title = txtNodeToStr(node);
      const titleHash = title.replace(/\W/g, '-').toLowerCase();
      const id = `${node.range.join('-')}-${titleHash}`;

      const contentNode = {
        id,
        type: node.type,
        value: node.value,
        title: node.title,
        url: node.url,
        alt: node.alt,
        children: node.children?.map(p),
      };

      if (node.type === 'Header') {
        tableContent.push({
          id,
          title,
        })
      }
      return contentNode
    }

    const bodyNode = p(node);

    return {
      tableContent,
      body: bodyNode,
    }
  }

  private async parseYamlContent(buffer: Buffer): Promise<Content> {
    const node = markdownToAst.parse(buffer.toString());

    throw new Error('Not implemented');
  }

  private async parseContent(contentType: string, buffer: Buffer): Promise<Content> {
    if (contentType === 'text/markdown') {
      return await this.parseMarkdownContent(buffer)
    }

    if (contentType === 'text/yaml') {
      return await this.parseYamlContent(buffer)
    }

    throw new Error(`Unsupported content type: ${contentType}`);
  }

  private async get(url: URL) {
    const buffer = await this.getBuffer(url);
    const contentType = this.toContentType(url);

    return {
      contentType,
      buffer,
      content: await this.parseContent(contentType, buffer),
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