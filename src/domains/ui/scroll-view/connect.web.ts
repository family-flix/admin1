import { ScrollViewCore } from ".";

export function connect(store: ScrollViewCore, $container: HTMLDivElement) {
  store.scrollTo = (position: Partial<{ left: number; top: number }>) => {
    $container.scrollTo(position);
  };
}
