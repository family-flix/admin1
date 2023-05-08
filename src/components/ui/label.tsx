import { JSX } from "solid-js/jsx-runtime";

import { cn } from "@/utils";

const LabelRoot = (
  props: JSX.HTMLAttributes<HTMLDivElement> & JSX.AriaAttributes
) => (
  <div ref={props.ref} class={cn(props.class)}>
    {props.children}
  </div>
);

const Root = LabelRoot;

export { Root };
