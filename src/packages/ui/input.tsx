/**
 * @file 输入框
 */
import { createSignal, JSX, onMount } from "solid-js";

import { InputCore } from "@/domains/ui/input";
import { connect } from "@/domains/ui/input/connect.web";
import { cn } from "@/utils";

const Input = (
  props: {
    store: InputCore;
  } & JSX.HTMLAttributes<HTMLInputElement>
) => {
  const { store } = props;

  let ref: HTMLInputElement;
  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  onMount(() => {
    const $input = ref;
    if (!$input) {
      return;
    }
    connect(store, $input);
    store.setMounted();
  });

  const value = () => state().value;
  const placeholder = () => state().placeholder;
  const disabled = () => state().disabled;
  const type = () => state().type;

  return (
    <input
      ref={(e) => (ref = e)}
      class={cn(props.class)}
      style={props.style}
      value={value()}
      placeholder={placeholder()}
      disabled={disabled()}
      type={type()}
      onInput={(event: Event & { currentTarget: HTMLInputElement }) => {
        const { value } = event.currentTarget;
        store.change(value);
      }}
      onChange={(event) => {
        const { value: v } = event.target;
        // console.log("[COMPONENT]ui/input onchange", v);
        store.change(v);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          store.handleEnter();
        }
      }}
      onBlur={() => {
        // console.log("[COMPONENT]ui/input onBlur");
        store.handleBlur();
      }}
    />
  );
};

export { Input };
