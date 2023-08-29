/**
 * @file 输入框
 */
import { createSignal, JSX, onMount } from "solid-js";

import { InputCore } from "@/domains/ui/input";
import { connect } from "@/domains/ui/input/connect.web";
import { cn } from "@/utils";

const Input = (
  props: {
    store: InputCore<string>;
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

  const value = () => {
    if (typeof state().value === "string") {
      return state().value;
    }
    return undefined;
  };
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
        // console.log("[COMPONENT]ui/input onInput");
        store.handleChange(event);
      }}
      // onChange={(event) => {
      //   console.log("[COMPONENT]ui/input onChange");
      //   store.handleChange(event);
      // }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          store.handleEnter();
        }
      }}
      onBlur={() => {
        store.handleBlur();
      }}
    />
  );
};

export { Input };
