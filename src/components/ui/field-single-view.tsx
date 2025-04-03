import { createSignal, For, Match, Switch } from "solid-js";

import { SingleFieldCore } from "@/domains/ui/formv2";

export function FieldSingleValuesView(props: { store: SingleFieldCore<any> }) {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((v) => setState(v));

  return (
    <div class="w-full">
      {(() => {
        if (state().hidden) {
          return null;
        }
        if (state().input?.type === "textarea") {
          return (
            <textarea
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={state().input?.value}
              onChange={(event) => {
                store.handleValueChange(event.target.value);
              }}
            />
          );
        }
        if (state().input?.shape === "input") {
          return (
            <input
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={state().input?.value}
              onChange={(event) => {
                store.handleValueChange(event.target.value);
              }}
            />
          );
        }
        if (state().input?.shape === "number") {
          return (
            <input
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={state().input?.value}
              type="number"
              onChange={(event) => {
                store.handleValueChange(event.target.value);
              }}
            />
          );
        }
        if (state().input?.shape === "checkbox") {
          return (
            <div class="flex items-center">
              <input
                class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all cursor-pointer"
                checked={state().input?.value}
                type="checkbox"
                onChange={(event) => {
                  store.handleValueChange(event.target.checked);
                }}
              />
              <span class="ml-2 text-gray-700">{state().label}</span>
            </div>
          );
        }
        if (state().input?.shape === "select") {
          return (
            <select
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all cursor-pointer"
              value={state().input?.value}
              onChange={(event) => {
                store.handleValueChange(event.target.value);
              }}
            >
              <For each={state().input?.options}>
                {(option) => <option value={option.value}>{option.label}</option>}
              </For>
            </select>
          );
        }
        return null;
      })()}
    </div>
  );
}
