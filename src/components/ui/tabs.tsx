import { JSX, Show, createContext, createSignal, useContext } from "solid-js";

import { TabsCore } from "@/domains/ui/tabs";
import { PresenceCore } from "@/domains/ui/presence";
import * as TabsPrimitive from '@/packages/ui/tabs';

export const Tabs = (props: { store: TabsCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;


  return (
    <TabsPrimitive.Root store={store}>

    </TabsPrimitive.Root>
  );
};
