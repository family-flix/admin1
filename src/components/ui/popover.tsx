/**
 * @file 气泡 组件
 */
import { Portal } from "solid-js/web";
import { createContext, createSignal, onCleanup, useContext } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { X } from "lucide-solid";

import { PopoverCore } from "@/domains/ui/popover";
import { cn } from "@/utils";

import { DismissableLayer } from "./dismissable-layer";
import { Presence } from "./presence";
import * as Popper from "./popper";

export const Popover = (
  props: {
    store: PopoverCore;
    content: JSX.Element;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store, children } = props;

  onCleanup(() => {
    store.unmount();
  });

  return (
    <PopoverRoot store={store}>
      <PopoverTrigger
        store={store}
        class="inline-flex items-center justify-center"
      >
        {children}
      </PopoverTrigger>
      <PopoverPortal store={store}>
        <PopoverContent
          store={store}
          class={cn(
            "relative rounded-md p-5 w-64 bg-white shadow-lg focus:shadow-md focus:ring-2 focus:ring-violet-700"
          )}
        >
          <div>{props.content}</div>
          <PopoverClose
            store={store}
            class="font-inherit rounded-full h-6 w-6 inline-flex items-center justify-center text-violet-900 absolute top-3 right-3"
          >
            <X class="w-4 h-4" />
          </PopoverClose>
          <PopoverArrow store={store} class="text-xl fill-white" />
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
  );
};

const PopoverContext = createContext<PopoverCore>();
const PopoverRoot = (
  props: { store: PopoverCore } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store, children } = props;
  // console.log("[COMPONENT]PopoverRoot", store);
  return <Popper.Root store={store.popper}>{children}</Popper.Root>;

  // return (
  //   <Popper.Root store={store.popper}>
  //     <PopoverContext.Provider value={store}>
  //       {props.children}
  //     </PopoverContext.Provider>
  //   </Popper.Root>
  // );
};

// const PopoverAnchor = (props: { children: JSX.Element }) => {
//   return <Popper.Anchor>{props.children}</Popper.Anchor>;
// };

/* -------------------------------------------------------------------------------------------------
 * PopoverTrigger
 * -----------------------------------------------------------------------------------------------*/
const PopoverTrigger = (
  props: {
    store: PopoverCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  // const store = useContext(PopoverContext);

  return (
    <Popper.Anchor store={store.popper} class={props.class}>
      <button
        onClick={() => {
          store.toggle();
        }}
      >
        {props.children}
      </button>
    </Popper.Anchor>
  );
};

/* -------------------------------------------------------------------------------------------------
 * PopoverPortal
 * -----------------------------------------------------------------------------------------------*/
const PopoverPortal = (
  props: {
    store: PopoverCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  // const { store, children } = props;
  // const store = useContext(PopoverContext);

  return <Portal>{props.children}</Portal>;
};

/* -------------------------------------------------------------------------------------------------
 * PopoverContent
 * -----------------------------------------------------------------------------------------------*/
const PopoverContent = (
  props: {
    store: PopoverCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const store = useContext(PopoverContext);

  return (
    <Presence store={store.present}>
      <PopoverContentNonModal store={store} class={props.class}>
        {props.children}
      </PopoverContentNonModal>
    </Presence>
  );
};

/* -----------------------------------------------------------------------------------------------*/
const PopoverContentNonModal = (
  props: {
    store: PopoverCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  return (
    <PopoverContentImpl store={store} class={props.class}>
      {props.children}
    </PopoverContentImpl>
  );
};

const FocusScope = (props: { children: JSX.Element }) => {
  return props.children;
};
const PopoverContentImpl = (
  props: {
    store: PopoverCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  return (
    <FocusScope>
      <DismissableLayer store={store.layer}>
        <Popper.Content store={store.popper} class={props.class}>
          {props.children}
        </Popper.Content>
      </DismissableLayer>
    </FocusScope>
  );
};

const PopoverClose = (
  props: {
    store: PopoverCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  // const store = useContext(PopoverContext);
  return (
    <button
      class={props.class}
      onClick={() => {
        store.hide();
      }}
    >
      {props.children}
    </button>
  );
};

const PopoverArrow = (
  props: { store: PopoverCore } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;
  return <Popper.Arrow store={store.popper} class={props.class}></Popper.Arrow>;
};
