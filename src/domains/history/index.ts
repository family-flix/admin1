import { BaseDomain, Handler } from "@/domains/base";
import { RouteViewCore } from "@/domains/route_view";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: void;
};

type HistoryCoreProps = {};
type HistoryCoreState = {};

export class HistoryCore extends BaseDomain<TheTypesOfEvents> {
  /** 最顶层的视图 */
  top: RouteViewCore | null = null;
  stacks: RouteViewCore[] = [];
  prevViews: RouteViewCore[] = [];

  constructor(props: Partial<{ _name: string }> & HistoryCoreProps) {
    super(props);
  }

  showView(view: RouteViewCore, query: Record<string, string>) {
    console.log("[DOMAIN]History - showView", view._name, view.parent);
    this.top = view;
    this.prevViews = this.stacks;
    this.stacks = [];
    const _show = (view: RouteViewCore) => {
      if (view.parent) {
        _show(view.parent);
        (() => {
          if (view.parent.canLayer) {
            view.parent.layerSubView(view);
            return;
          }
          view.parent.showSubView(view);
        })();
      }
      view.show();
      this.stacks.push(view);
    };
    _show(view);
  }
  back() {
    history.back();
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
