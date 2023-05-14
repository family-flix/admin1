import { BaseDomain } from "@/domains/base";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: FormSourceState;
};
type FormSourceState = {};
type FormSourceProps = {};

export class FormSourceCore extends BaseDomain<TheTypesOfEvents> {}
