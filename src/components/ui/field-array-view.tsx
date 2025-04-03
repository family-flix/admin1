import { createSignal, For, Match, Switch } from "solid-js";
import { Trash, ArrowUp, ArrowDown } from "lucide-solid";

import { ArrayFieldCore } from "@/domains/ui/formv2";

import { FieldSingleValuesView } from "./field-single-view";
import { FieldObjectValuesView } from "./field-object-view";

export function FieldArrayValuesView(props: { store: ArrayFieldCore<any> }) {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((v) => setState(v));

  return (
    <div class="w-full space-y-3 my-2">
      <div
        class="inline-flex items-center justify-center py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-pointer text-sm font-medium"
        onClick={() => {
          store.append();
        }}
      >
        添加{state().label}
      </div>
      <div class="space-y-3">
        <For each={state().fields}>
          {(field, index) => {
            const $inner = store.mapFieldWithIndex(index());
            if (!$inner) {
              return null;
            }
            return (
              <div class="p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                <div class="flex justify-between items-center mb-2">
                  <div class="text-sm font-medium text-gray-500">
                    {field.label} {index() + 1}
                  </div>
                  <div class="flex items-center">
                    <div
                      class="text-red-500 hover:text-red-700 cursor-pointer p-1"
                      onClick={() => {
                        store.remove(field.id);
                      }}
                    >
                      <Trash class="w-4 h-4" />
                    </div>
                    <div
                      class="text-blue-500 hover:text-blue-700 cursor-pointer p-1"
                      onClick={() => {
                        store.upIdx(field.id);
                      }}
                    >
                      <ArrowUp class="w-4 h-4" />
                    </div>
                    <div
                      class="text-blue-500 hover:text-blue-700 cursor-pointer p-1"
                      onClick={() => {
                        store.downIdx(field.id);
                      }}
                    >
                      <ArrowDown class="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <Switch>
                  <Match when={$inner.field.symbol === "SingleFieldCore"}>
                    <FieldSingleValuesView store={$inner.field} />
                  </Match>
                  <Match when={$inner.field.symbol === "ArrayFieldCore"}>
                    <FieldArrayValuesView store={$inner.field} />
                  </Match>
                  <Match when={$inner.field.symbol === "ObjectFieldCore"}>
                    <FieldObjectValuesView store={$inner.field} />
                  </Match>
                </Switch>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}
