import * as markdownToAst from "@textlint/markdown-to-ast";
import { TxtNode } from "@textlint/ast-node-types";
import { ContentNode } from "../types/content-node";
import { ItemTableContent } from "../../../types/item-table-content";
import { Content } from "../types/content";
import { ParseEngine, ParseEngineInstance } from "../types/parse-engine";


export class MarkdownParseEngine extends ParseEngineInstance {
  constructor(readonly url: URL, readonly initialNode: any) {
    super();
  }

  private tableContent: ItemTableContent[] = [];

  txtNodeToStr(node: TxtNode): string {
    if (typeof node.value === 'string')
      return node.value;
    if (Array.isArray(node.children))
      return node.children.map(node => this.txtNodeToStr(node)).join('');
    return ``;
  }

  relativeUrl(fromUrl?: URL): undefined | URL {
    if (!fromUrl)
      return undefined;

    return new URL(fromUrl, this.url);
  }

  mdNodesToContentNode(node: TxtNode): ContentNode {
    const title = this.txtNodeToStr(node);
    const titleHash = title.replace(/\W/g, '-').toLowerCase();
    const id = `${node.range.join('-')}-${titleHash}`.substring(0, 30);

    const contentNode = {
      id,
      type: node.type,
      value: node.value,
      title: node.title,
      url: this.relativeUrl(node.url),
      alt: node.alt,
      children: node.children?.map((node: any) => this.mdNodesToContentNode(node)),
    };

    if (node.type === 'Header') {
      this.tableContent.push({
        id,
        title,
      });
    }
    return contentNode;
  }

  async toContentNodes(): Promise<Content> {
    const bodyNode = this.mdNodesToContentNode(this.initialNode);

    return {
      tableContent: this.tableContent,
      body: bodyNode,
    };
  }

  static async parse(buffer: Buffer): Promise<TxtNode> {
    return markdownToAst.parse(buffer.toString());
  }
}
