import { FC, PropsWithChildren } from "react";
import { TxtNode } from "@textlint/ast-node-types";
import classNames from "classnames";


export namespace MD {
  type T = FC<PropsWithChildren<{
    node: TxtNode;
    className?: string;
  } & Record<string, any>>>;

  const CmpDefault: T = (({ node, children, ...props }) => <span {...props}>{children}</span>);

  const types: Record<string, T | undefined> = {
    Yaml: () => null,
    Html: ({ node }) => <div dangerouslySetInnerHTML={{ __html: node.value }}></div>,
    Document: ({ node, children, ...props }) => <div {...props}>{children}</div>,
    Paragraph: ({ node, children, ...props }) => <p {...props}>{children}</p>,
    Str: ({ node, children, ...props }) => <>{children}</>,
    Strong: ({ node, children, ...props }) => <strong {...props}>{children}</strong>,
    Image: ({ node, children, ...props }) => <img title={node.title} src={node.url} alt={node.alt} {...props}></img>,
    // FootnoteReference: ({ node, children, ...props }) => <a {...props}>{node.label}</a>,
    footnoteDefinition: ({ node, children, ...props }) => null,
    Link: ({ node, children, ...props }) => <a title={node.title} href={node.url} {...props}>{children}</a>,
    Table: ({ node, children, className, ...props }) => <table className={classNames(className, 'table-auto')} {...props}>
      <tbody>{children}</tbody>
    </table>,
    TableRow: ({ node, children, ...props }) => <tr {...props}>{children}</tr>,
    TableCell: ({ node, children, ...props }) => <td {...props}>{children}</td>,
    CodeBlock: ({ node, children, ...props }) => <pre {...props}><code>{children}</code></pre>,
    List: ({ node, children, ...props }) => <ul {...props}>{children}</ul>,
    ListItem: ({ node, children, ...props }) => <li {...props}>{children}</li>,
    Code: ({ node, children, ...props }) => <code {...props}>{children}</code>,
    BlockQuote: ({ node, children, style, ...props }) => <div {...props}>{children}</div>,
    Delete: ({ node, children, ...props }) => <del {...props}>{children}</del>,
    Emphasis: ({ node, children, ...props }) => <em {...props}>{children}</em>,
    Header: ({ node, children, className, ...props }) => {
      if (node.depth === 1) return <h1 className={classNames(className, "text-2xl")} {...props}>{children}</h1>
      if (node.depth === 2) return <h2 className={classNames(className, "text-xl")} {...props}>{children}</h2>
      if (node.depth === 3) return <h3 className={classNames(className, "text-lg")} {...props}>{children}</h3>
      if (node.depth === 4) return <h4 className={classNames(className, "text-base")} {...props}>{children}</h4>
      if (node.depth === 5) return <h5 {...props}>{children}</h5>
      if (node.depth === 6) return <h6 {...props}>{children}</h6>
      return null;
    },
    HorizontalRule: ({ node, children, ...props }) => <hr {...props}></hr>,
    default: CmpDefault,
  }


  export const Factory: T = ({ node, className, ...props }) => {
    const F: T = types[node.type] ?? types.default ?? CmpDefault;

    return <F x-node-type={node.type} node={node} className={className && classNames(className)} {...props}>
      {node.value}
      {node.children?.map((child: TxtNode) => <Factory key={child.range.join('-')} x-key={child.range.join('-')} node={child}></Factory>)}
    </F>;
  };
}
