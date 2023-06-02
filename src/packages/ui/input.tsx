/**
 * @file 输入框
 */
import { createSignal, JSX } from "solid-js";

import { InputCore } from "@/domains/ui/input";
import { cn } from "@/utils";

const Input = (
  props: {
    store: InputCore;
  } & JSX.HTMLAttributes<HTMLInputElement>
) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const value = () => state().value;
  const placeholder = () => state().placeholder;
  const disabled = () => state().disabled;
  const type = () => state().type;

  return (
    <input
      class={cn(props.class)}
      value={value()}
      placeholder={placeholder()}
      disabled={disabled()}
      type={type()}
      onInput={(event: Event & { currentTarget: HTMLInputElement }) => {
        const { value } = event.currentTarget;
        store.change(value);
      }}
    />
  );
};

export { Input };
