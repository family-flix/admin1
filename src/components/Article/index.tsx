import { For, JSX } from "solid-js";
import { Dynamic } from "solid-js/web";

import {
  ArticleCore,
  ArticleHeadNode,
  ArticleLineNode,
  ArticleLinkNode,
  ArticleListNode,
  ArticleNodeType,
  ArticleSectionNode,
  ArticleTextNode,
} from "@/domains/article";

export function Article(props: { nodes: ArticleCore["children"] }) {
  // console.log("nodes", JSON.stringify(props.nodes));
  return (
    <For each={props.nodes}>
      {(node) => {
        if (node.type === ArticleNodeType.Line) {
          return (
            <>
              {/* <span class="text-slate-500">{node.created}</span> */}
              <ArticleLine node={node as ArticleLineNode} />
            </>
          );
        }
        if (node.type === ArticleNodeType.Section) {
          return (
            <>
              {/* <span class="text-slate-500">{node.created}</span> */}
              <ArticleSection node={node as ArticleSectionNode} />
            </>
          );
        }
        return "unknown";
      }}
    </For>
  );
}

export function ArticleLine(props: { node: ArticleLineNode }) {
  return (
    <p>
      <For each={props.node.children}>
        {(node) => {
          if (node.type === ArticleNodeType.Head) {
            return <ArticleHead node={node as ArticleHeadNode} />;
          }
          if (node.type === ArticleNodeType.Text) {
            return <ArticleText node={node as ArticleTextNode} />;
          }
          if (node.type === ArticleNodeType.Link) {
            return <ArticleLink node={node as ArticleLinkNode} />;
          }
          if (node.type === ArticleNodeType.List) {
            return <ArticleList node={node as ArticleListNode} />;
          }
          return null;
        }}
      </For>
    </p>
  );
}

export function ArticleSection(props: { node: ArticleSectionNode }) {
  return (
    <div class="mt-4">
      <For each={props.node.children}>
        {(node) => {
          if (node.type === ArticleNodeType.List) {
            return <ArticleList node={node as ArticleListNode} />;
          }
          return (
            <>
              {/* {node.created} */}
              <ArticleLine node={node as ArticleLineNode} />
            </>
          );
        }}
      </For>
    </div>
  );
}

export function ArticleHead(props: { node: ArticleHeadNode }) {
  const {
    node: { text, level, color },
  } = props;

  const elements: Record<number, () => JSX.Element> = {
    1: () => (
      <h1 class="text-2xl" style={{ color }}>
        {text}
      </h1>
    ),
    2: () => (
      <h2 class="text-xl" style={{ color }}>
        {text}
      </h2>
    ),
    3: () => (
      <h3 class="text-lg" style={{ color }}>
        {text}
      </h3>
    ),
  };

  return <Dynamic component={elements[level]} />;
}

export function ArticleText(props: { node: ArticleTextNode }) {
  const {
    node: { color, text },
  } = props;
  return <span style={{ color }}>{text}</span>;
}

export function ArticleLink(props: { node: ArticleLinkNode }) {
  const {
    node: { text, href },
  } = props;
  return <a href={href}>{text}</a>;
}

export function ArticleList(props: { node: ArticleListNode }) {
  const {
    node: { children },
  } = props;
  return (
    <ol>
      <For each={children}>
        {(node) => {
          return (
            <li>
              <ArticleLine node={node} />
            </li>
          );
        }}
      </For>
    </ol>
  );
}
