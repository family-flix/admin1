/**
 * @file 输入框
 */
import { JSX } from "solid-js";

import { InputCore } from "@/domains/ui/input";
import { Input as InputPrimitive } from "@/packages/ui/input";
import { cn } from "@/utils";

const Input = (
  props: {
    store: InputCore;
  } & JSX.HTMLAttributes<HTMLInputElement>
) => {
  const { store } = props;

  // const [state, setState] = createSignal(store.state);
  // store.onStateChange((nextState) => {
  //   setState(nextState);
  // });

  return (
    <InputPrimitive
      class={cn(
        "flex h-10 w-full rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900",
        props.class
      )}
      store={store}
    />
  );
};

export { Input };
