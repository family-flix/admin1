import { JSX } from "solid-js/jsx-runtime";

import { cn } from "@/utils";

const Root = (
  props: JSX.HTMLAttributes<HTMLDivElement> & JSX.AriaAttributes
) => (
  <div ref={props.ref} class={cn(props.class)}>
    {props.children}
  </div>
);
const Label = Root;
export { Root, Label };
