/**
 * @file 进度条
 */
import { createSignal } from "solid-js";
import { ProgressCore } from "@/domains/ui/progress";

import { cn } from "@/lib/utils";

const Progress = (props: { className?: string; store: ProgressCore }) => {
  const { className, store, ...restProps } = props;
  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  return (
    <div
      class={cn(
        "relative h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800",
        className
      )}
      {...restProps}
    >
      <div
        class="h-full w-full flex-1 bg-slate-900 transition-all dark:bg-slate-400"
        style={{ transform: `translateX(-${100 - (state().value || 0)}%)` }}
      />
    </div>
  );
};
// Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
