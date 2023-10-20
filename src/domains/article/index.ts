/**
 * @file 一篇文章的抽象节点
 * 为了消息提示
 */
import { BaseDomain, Handler } from "@/domains/base";

enum Events {
  PushText,
}
type TheTypesOfEvents = {
  [Events.PushText]: ArticleLineNode | ArticleSectionNode;
};
type ArticleProps = {
  on_push?: (v: ArticleLineNode | ArticleSectionNode) => void;
};
export class ArticleCore extends BaseDomain<TheTypesOfEvents> {
  static async New() {}

  children: (ArticleLineNode | ArticleSectionNode)[] = [];

  constructor(options: Partial<{}> & ArticleProps) {
    super();

    const { on_push } = options;
    if (on_push) {
      this.on_push(on_push);
    }
  }

  write(text: ArticleLineNode | ArticleSectionNode) {
    this.children.push(text);
    this.emit(Events.PushText, text);
    return text;
  }
  to_json() {
    const obj = this.children.map((line) => line.to_json());
    return obj;
  }

  on_push(handler: Handler<TheTypesOfEvents[Events.PushText]>) {
    this.on(Events.PushText, handler);
  }
}

type ArticleSectionNodeProps = {
  created: string;
  children: (ArticleLineNode | ArticleListNode)[];
};
export class ArticleSectionNode extends BaseDomain<TheTypesOfEvents> {
  type: ArticleNodeType;
  created: string;
  values: ArticleSectionNodeProps;
  children: ArticleSectionNodeProps["children"];

  constructor(values: ArticleSectionNodeProps) {
    super();

    const { created, children } = values;
    this.created = created;
    this.values = values;
    this.type = ArticleNodeType.Section;
    this.children = children;
  }

  to_json() {
    const { children } = this.values;
    return {
      children: children.map((t): object => {
        return t.to_json();
      }),
    };
  }
}

type ArticleLineNodeProps = {
  created: string;
  color?: string;
  value?: unknown;
  children: (ArticleTextNode | ArticleLinkNode | ArticleListNode | ArticleCardNode)[];
};
export class ArticleLineNode extends BaseDomain<TheTypesOfEvents> {
  type: ArticleNodeType;
  created: string;
  values: ArticleLineNodeProps;
  children: ArticleLineNodeProps["children"];
  color: ArticleLineNodeProps["color"];
  value: ArticleLineNodeProps["value"];

  constructor(values: ArticleLineNodeProps) {
    super();

    const { children, color, value, created } = values;
    this.type = ArticleNodeType.Line;
    this.created = created;
    this.children = children;
    this.color = color;
    this.value = value;
    this.values = values;
  }

  to_json() {
    const { children, color, value } = this.values;
    return {
      color,
      value,
      children: children.map((t): object => {
        return t.to_json();
      }),
    };
  }
}

type ArticleHeadNodeProps = {
  text: string;
  level: number;
  color?: string;
};
export class ArticleHeadNode extends BaseDomain<TheTypesOfEvents> {
  type: ArticleNodeType;
  values: ArticleHeadNodeProps;
  text: ArticleHeadNodeProps["text"];
  level: ArticleHeadNodeProps["level"];
  color: ArticleHeadNodeProps["color"];

  constructor(values: ArticleHeadNodeProps) {
    super();

    const { level, text, color } = values;
    this.type = ArticleNodeType.Head;
    this.color = color;
    this.text = text;
    this.level = level;
    this.values = values;
  }

  to_json() {
    const { level, color, text } = this.values;
    return {
      color,
      level,
      text,
    };
  }
}

type ArticleTextNodeProps = {
  text: string;
  color?: string;
};
export class ArticleTextNode extends BaseDomain<TheTypesOfEvents> {
  type: ArticleNodeType;
  values: ArticleTextNodeProps;
  text: ArticleTextNodeProps["text"];
  color: ArticleTextNodeProps["color"];

  constructor(values: ArticleTextNodeProps) {
    super();

    const { text, color } = values;
    this.type = ArticleNodeType.Text;
    this.text = text;
    this.color = color;
    this.values = values;
  }

  to_json() {
    const { color, text } = this.values;
    return {
      color,
      text,
    };
  }
}

type ArticleLinkNodeProps = {
  text: string;
  href: string;
};
export class ArticleLinkNode extends BaseDomain<TheTypesOfEvents> {
  type: ArticleNodeType;
  values: ArticleLinkNodeProps;
  text: ArticleLinkNodeProps["text"];
  href: ArticleLinkNodeProps["href"];

  constructor(values: ArticleLinkNodeProps) {
    super();

    const { text, href } = values;
    this.type = ArticleNodeType.Link;
    this.text = text;
    this.href = href;
    this.values = values;
  }

  to_json() {
    const { href, text } = this.values;
    return {
      href,
      text,
    };
  }
}

type ArticleListNodeProps = {
  children: ArticleLineNode[];
};
export class ArticleListNode extends BaseDomain<TheTypesOfEvents> {
  type: ArticleNodeType;
  values: ArticleListNodeProps;
  children: ArticleListNodeProps["children"];

  constructor(values: ArticleListNodeProps) {
    super();

    const { children } = values;
    this.type = ArticleNodeType.List;
    this.children = children;
    this.values = values;
  }

  to_json() {
    const { children } = this.values;
    return {
      children: children.map((c) => c.to_json()),
    };
  }
}

type ArticleListItemNodeProps = {
  children: (ArticleTextNode | ArticleLinkNode)[];
};
export class ArticleListItemNode extends BaseDomain<TheTypesOfEvents> {
  type: ArticleNodeType;
  values: ArticleListItemNodeProps;
  children: ArticleListItemNodeProps["children"];

  constructor(values: ArticleListItemNodeProps) {
    super();

    const { children } = values;
    this.type = ArticleNodeType.ListItem;
    this.children = children;
    this.values = values;
  }

  to_json() {
    const { children } = this.values;
    return {
      children: children.map((c) => c.to_json()),
    };
  }
}

type ArticleCardNodeProps = {
  value: unknown;
};
export class ArticleCardNode extends BaseDomain<TheTypesOfEvents> {
  type: ArticleNodeType;
  values: ArticleCardNodeProps;
  value: ArticleCardNodeProps["value"];

  constructor(values: ArticleCardNodeProps) {
    super();

    const { value } = values;
    this.type = ArticleNodeType.Card;
    this.value = value;
    this.values = values;
  }

  to_json() {
    const { value } = this.values;
    return {
      value,
    };
  }
}

export enum ArticleNodeType {
  Line,
  Section,
  Head,
  Text,
  Link,
  List,
  ListItem,
  Card,
}
