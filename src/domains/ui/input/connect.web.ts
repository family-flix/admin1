import { InputCore } from ".";

export function connect(store: InputCore<string>, $input: HTMLInputElement) {
  store.focus = () => {
    $input.focus();
  };
}
