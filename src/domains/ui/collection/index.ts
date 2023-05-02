import { BaseDomain } from "@/domains/base";

enum Events {}
type TheTypesOfEvents = {};

export class CollectionCore extends BaseDomain<TheTypesOfEvents> {
  itemMap: Set<unknown> = new Set();
}
