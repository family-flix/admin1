import { BaseDomain, Handler } from "@/domains/base";
import { Show, createSignal } from "solid-js";
import { Loader2 } from "lucide-solid";

enum Events {
  Read,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Read]: string;
  [Events.StateChange]: SubtitleReaderState;
};
type SubtitleReaderState = {
  loading: boolean;
  content: string | null;
};
type SubtitleReaderProps = {
  onRead?: () => void;
};
export class SubtitleReaderCore extends BaseDomain<TheTypesOfEvents> {
  loading = false;
  content: string | null = null;

  get state() {
    return {
      loading: this.loading,
      content: this.content,
    };
  }

  constructor(props: Partial<{ _name: string }> & SubtitleReaderProps) {
    super(props);

    const { onRead } = props;
    if (onRead) {
      this.onRead(onRead);
    }
  }

  read(file: File) {
    const reader = new FileReader();
    this.loading = true;
    this.emit(Events.StateChange, { ...this.state });
    reader.onload = (e) => {
      this.loading = false;
      if (e.target) {
        const content = e.target.result as string;
        this.content = content;
        this.emit(Events.Read, content);
      }
      this.emit(Events.StateChange, { ...this.state });
    };
    reader.readAsText(file);
  }
  clear() {
    this.content = null;
    this.emit(Events.StateChange, { ...this.state });
  }

  onRead(handler: Handler<TheTypesOfEvents[Events.Read]>) {
    return this.on(Events.Read, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}

export const SubtitlePreview = (props: { store: SubtitleReaderCore }) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  return (
    <div class="relative">
      <Show when={state().loading}>
        <div class="absolute inset-0">
          <Loader2 class="w-8 h-8 animate animate-spin" />
        </div>
      </Show>
      <Show when={!!state().content}>
        <div class="w-full max-h-[360px] overflow-x-auto overflow-y-auto">
          <div class="p-4 keep-all white-space-nowrap">{state().content}</div>
        </div>
      </Show>
    </div>
  );
};
