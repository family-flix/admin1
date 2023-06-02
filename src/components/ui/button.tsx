/**
 * @file 按钮
 */
import { JSX } from "solid-js";
import { VariantProps, cva } from "class-variance-authority";
import { Loader } from "lucide-solid";

import { ButtonCore } from "@/domains/ui/button";
import * as ButtonPrimitive from "@/packages/ui/button";
import { cn } from "@/utils";

const buttonVariants = cva(
  "active:scale-95 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:hover:bg-slate-800 dark:hover:text-slate-100 disabled:opacity-50 dark:focus:ring-slate-400 disabled:pointer-events-none dark:focus:ring-offset-slate-900 data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-50 dark:text-slate-900",
        destructive: "bg-red-500 text-white hover:bg-red-600 dark:hover:bg-red-600",
        outline: "bg-transparent border border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100",
        subtle: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100",
        ghost:
          "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-100 dark:hover:text-slate-100 data-[state=open]:bg-transparent dark:data-[state=open]:bg-transparent",
        link: "bg-transparent dark:bg-transparent underline-offset-4 hover:underline text-slate-900 dark:text-slate-100 hover:bg-transparent dark:hover:bg-transparent",
      },
      size: {
        default: "py-2 px-4",
        sm: "px-2 rounded-md",
        lg: "px-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button<T = unknown>(
  props: {
    store: ButtonCore<T>;
  } & VariantProps<typeof buttonVariants> &
    JSX.HTMLAttributes<HTMLButtonElement>
) {
  const { store, variant, size } = props;

  return (
    <ButtonPrimitive.Root store={store} class={buttonVariants({ variant, size, class: cn(props.class, "space-x-2") })}>
      <ButtonPrimitive.Prefix store={store}>
        <Loader class="animation animate-spin" width={12} height={12} />
      </ButtonPrimitive.Prefix>
      <ButtonPrimitive.Text store={store}>{props.children}</ButtonPrimitive.Text>
    </ButtonPrimitive.Root>
  );
}

export { Button };
