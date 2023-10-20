import { BaseDomain, Handler } from "@/domains/base";
import { RefCore } from "@/domains/cur";
import { DriveCore } from "@/domains/drive";

enum Events {
  StateChange,
  Change,
}
type TheTypesOfEvents = {
  [Events.StateChange]: DriveSelectState;
  [Events.Change]: DriveCore;
};

type DriveSelectProps = {};
type DriveSelectState = {};

export class DriveSelectCore extends BaseDomain<TheTypesOfEvents> {
  ref = new RefCore<DriveCore>();

  get value() {
    return this.ref.value;
  }

  constructor(props: Partial<{ _name: string }> & DriveSelectProps) {
    super(props);

    //     const transferConfirmDialog = new Dia();
    this.ref.onStateChange((nextState) => {
      this.emit(Events.Change, nextState);
    });
  }

  select(v: DriveCore) {
    this.ref.select(v);
  }

  onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
    return this.on(Events.Change, handler);
  }
}
