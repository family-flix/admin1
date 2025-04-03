import { For, Match, Switch, createSignal } from "solid-js";

import { ObjectFieldCore } from "@/domains/ui/formv2";

import { FieldArrayValuesView } from "./field-array-view";
import { FieldSingleValuesView } from "./field-single-view";

export function FieldObjectValuesView(props: { store: ObjectFieldCore<any> }) {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((v) => setState(v));

  return (
    <div class="w-full space-y-4 my-2">
      <For each={state().fields}>
        {(field) => {
          if (field.hidden) {
            return null;
          }
          const $inner = store.mapFieldWithName(field.name);
          if (!$inner) {
            return null;
          }
          return (
            <div class="w-full">
              <div class="flex mb-2">
                <label class="block w-16 pt-2 mr-4 text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <div class="flex-1 w-0">
                  {$inner.symbol === "ArrayFieldCore" ? (
                    <FieldArrayValuesView store={$inner} />
                  ) : $inner.symbol === "SingleFieldCore" ? (
                    <FieldSingleValuesView store={$inner} />
                  ) : $inner.symbol === "ObjectFieldCore" ? (
                    <FieldObjectValuesView store={$inner} />
                  ) : null}
                </div>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}
