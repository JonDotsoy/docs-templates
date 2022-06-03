export interface ContentNode {
  id: string;
  type: string;
  value?: string;
  title?: string;
  url?: URL;
  alt?: string;
  children?: ContentNode[];
}
