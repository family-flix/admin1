// @ts-nocheck
import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";

enum Events {
  StateChange,
  Select,
  Leave,
  Enter,
  Move,
  Focus,
  Blur,
}
type TheTypesOfEvents = {
  [Events.StateChange]: SelectItemState;
  [Events.Select]: void;
  [Events.Leave]: void;
  [Events.Enter]: void;
  [Events.Focus]: void;
  [Events.Blur]: void;
};
type SelectItemState = {
  /** 标志唯一值 */
  value: string;
  selected: boolean;
  focused: boolean;
  disabled: boolean;
};
export class SelectItemCore extends BaseDomain<TheTypesOfEvents> {
  name = "SelectItemCore";
  debug = true;

  value: unknown = undefined;
  state: SelectItemState = {
    value: undefined,
    selected: false,
    focused: false,
    disabled: false,
  };

  text: {
    $node: () => HTMLElement;
    getRect: () => DOMRect;
    getStyles: () => CSSStyleDeclaration;
  } | null;

  _leave = false;
  _enter = false;

  constructor(
    options: Partial<{
      name: string;
      value: string;
      state: Partial<SelectItemState>;
      $node: () => HTMLElement;
      getRect: () => DOMRect;
      getStyles: () => CSSStyleDeclaration;
    }> = {}
  ) {
    super(options);
    const { name, value, state, $node, getRect, getStyles } = options;
    // console.log("[SelectItemCore]constructor", state);
    this.state.value = value;
    if (name) {
      this.name = `${this.name}_${name}`;
    }
    this.value = value;
    this.state = {
      ...this.state,
      ...state,
    };
    if ($node) {
      this.$node = $node;
    }
    if (getRect) {
      this.getRect = getRect;
    }
    if (getStyles) {
      this.getStyles = getStyles;
    }
  }
  $node(): HTMLElement | null {
    return null;
  }
  getRect() {
    return {} as DOMRect;
  }
  getStyles() {
    return {} as CSSStyleDeclaration;
  }
  get offsetHeight() {
    return this.$node()?.offsetHeight ?? 0;
  }
  get offsetTop() {
    return this.$node()?.offsetTop ?? 0;
  }
  setText(text: SelectItemCore["text"]) {
    this.text = text;
  }
  select() {
    // if (this.state.selected) {
    //   return;
    // }
    this.state.selected = true;
    this.emit(Events.StateChange, { ...this.state });
  }
  unselect() {
    // if (this.state.selected === false) {
    //   return;
    // }
    this.state.selected = false;
    this.emit(Events.StateChange, { ...this.state });
  }
  focus() {
    if (this.state.focused === true) {
      return;
    }
    this.state.focused = true;
    this.emit(Events.StateChange, { ...this.state });
    this.emit(Events.Focus);
  }
  blur() {
    if (this.state.focused === false) {
      return;
    }
    this.state.focused = false;
    this.emit(Events.StateChange, { ...this.state });
    this.emit(Events.Blur);
  }
  leave() {
    this.emit(Events.Leave);
  }
  move(pos: { x: number; y: number }) {
    if (this.state.disabled) {
      this.leave();
      return;
    }
    // console.log("[SelectItemCore]move - prepare focus");
    this.focus();
  }
  enter() {
    if (this._enter === true) {
      return;
    }
    this._enter = true;
    this.emit(Events.Enter);
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
  onLeave(handler: Handler<TheTypesOfEvents[Events.Leave]>) {
    this.on(Events.Leave, handler);
  }
  onEnter(handler: Handler<TheTypesOfEvents[Events.Enter]>) {
    this.on(Events.Enter, handler);
  }
  onFocus(handler: Handler<TheTypesOfEvents[Events.Focus]>) {
    this.on(Events.Focus, handler);
  }
  onBlur(handler: Handler<TheTypesOfEvents[Events.Blur]>) {
    this.on(Events.Blur, handler);
  }
}
