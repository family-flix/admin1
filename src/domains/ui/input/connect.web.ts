import { InputCore } from ".";

export function connect(store: InputCore, $input: HTMLInputElement) {
  store.focus = () => {
    $input.focus();
  };
}
