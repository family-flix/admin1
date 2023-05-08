import { JSX, Show, createContext, createSignal, useContext } from "solid-js";

import { TabsCore } from "@/domains/ui/tabs";
import { PresenceCore } from "@/domains/ui/presence";

import * as RovingFocusGroup from "./roving-focus";
import { Presence } from "./presence";

const TabsContext = createContext<TabsCore>();
const TabsRoot = (
  props: {
    store: TabsCore;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });
  const direction = () => state().dir;
  const orientation = "";

  return (
    <TabsContext.Provider value={store}>
      <div data-orientation={orientation} class={props.class}>
        {props.children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = (props: {} & JSX.HTMLAttributes<HTMLElement>) => {
  // const { store } = props;
  const store = useContext(TabsContext);

  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const orientation = () => state().orientation;

  return (
    <RovingFocusGroup.Root store={store.roving}>
      <div class={props.class} role="tablist" aria-orientation={orientation()}>
        {props.children}
      </div>
    </RovingFocusGroup.Root>
  );
};

const TabsTrigger = (
  props: {
    value: string;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { value } = props;
  const store = useContext(TabsContext);

  return (
    <RovingFocusGroup.Item>
      <button
        class={props.class}
        onMouseDown={(event) => {
          if (event.button === 0 && event.ctrlKey === false) {
            store.selectTab(value);
          }
        }}
        onKeyDown={(event) => {
          if ([" ", "Enter"].includes(event.key)) {
            store.selectTab(value);
          }
        }}
        onFocus={() => {
          // ...
        }}
      >
        {props.children}
      </button>
    </RovingFocusGroup.Item>
  );
};

const TabsContent = (
  props: {
    value: string;
  } & JSX.HTMLAttributes<HTMLElement>
) => {
  const { value } = props;
  const store = useContext(TabsContext);

  const presence = new PresenceCore();
  const [state, setState] = createSignal(store.state);
  const [presenceState, setPresenceState] = createSignal(presence.state);
  presence.onStateChange((nextState) => {
    setPresenceState(nextState);
  });
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  store.appendContent({
    id: store.uid(),
    value,
    presence,
  });

  const orientation = () => state().orientation;
  const isSelected = () => state().curValue === value;
  const open = () => presenceState().open;

  return (
    <Presence store={presence}>
      <div
        class={props.class}
        data-state={isSelected ? "active" : "inactive"}
        data-orientation={orientation()}
        role="tabpanel"
        // aria-labelledby={triggerId}
        hidden={!open()}
        // id={contentId}
        tabIndex={0}
      >
        <Show when={open()}>{props.children}</Show>
      </div>
    </Presence>
  );
};

const Root = TabsRoot;
const List = TabsList;
const Trigger = TabsTrigger;
const Content = TabsContent;

export { Root, List, Trigger, Content };
