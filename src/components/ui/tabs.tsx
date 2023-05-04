import { JSX, Show, createContext, createSignal, useContext } from "solid-js";

import { TabsCore } from "@/domains/ui/tabs";

import * as RovingFocusGroup from "./roving-focus";
import { Presence } from "./presence";
import { PresenceCore } from "@/domains/ui/presence";

const TabsContext = createContext<TabsCore>();
const TabsRoot = (props: {
  store: TabsCore;
  class?: string;
  children: JSX.Element;
}) => {
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

const TabsList = (props: { class?: string; children: JSX.Element }) => {
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

const TabsTrigger = (props: {
  value: string;
  class?: string;
  children: JSX.Element;
}) => {
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

const TabsContent = (props: {
  value: string;
  class?: string;
  children: JSX.Element;
}) => {
  const { value } = props;
  const store = useContext(TabsContext);

  const [state, setState] = createSignal(store.state);

  const presence = new PresenceCore();
  store.appendContent({
    id: store.uid(),
    value,
    presence,
  });

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const orientation = () => state().orientation;
  const isSelected = () => state().curValue === value;

  return (
    <Presence store={presence}>
      {(presenceProps) => {
        return (
          <div
            class={props.class}
            data-state={isSelected ? "active" : "inactive"}
            data-orientation={orientation()}
            role="tabpanel"
            // aria-labelledby={triggerId}
            hidden={!presenceProps.present}
            // id={contentId}
            tabIndex={0}
          >
            <Show when={presenceProps.present}>{props.children}</Show>
          </div>
        );
      }}
    </Presence>
  );
};

const Root = TabsRoot;
const List = TabsList;
const Trigger = TabsTrigger;
const Content = TabsContent;

export { Root, List, Trigger, Content };
