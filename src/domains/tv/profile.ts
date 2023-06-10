import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";

enum Events {
  StateChange,
  Click,
}
type TheTypesOfEvents = {
  [Events.StateChange]: TVProfileState;
  [Events.Click]: void;
};
type TVProfileState = {
  id: string;
  name: string;
  poster: string;
  overview: string;
  firstAirDate: string;
};
type TVProfileProps = {
  id: string;
  name: string;
  poster: string;
  overview: string;
  firstAirDate: string;
};

export class TVProfileCore extends BaseDomain<TheTypesOfEvents> {
  // id: string;

  state: TVProfileState | null = null;

  constructor(options: Partial<{ _name: string } & TVProfileProps> = {}) {
    super(options);
    const { id, name, poster: posterPath, overview, firstAirDate } = options;
    // this.id = id;
    // this.name = id;
    // this.state = {
    //   id,
    //   name,
    //   poster: posterPath,
    //   overview,
    //   firstAirDate,
    // };
  }
  set(profile: TVProfileState) {
    this.state = profile;
    this.emit(Events.StateChange, { ...this.state });
  }
  click() {
    this.emit(Events.Click);
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}
