import debounce from "lodash/fp/debounce";

export class LocalCache {
  _values: Record<string, unknown> = {};

  constructor() {
    this._values = JSON.parse(localStorage.getItem("global") || "{}");
  }

  get values() {
    return this._values;
  }

  init(values: Record<string, unknown>) {
    this._values = values;
  }

  set = debounce(100, (key: string, values: unknown) => {
    const nextValues = {
      ...this._values,
      [key]: values,
    };
    this._values = nextValues;
    localStorage.setItem("global", JSON.stringify(nextValues));
  }) as (key: string, value: unknown) => void;

  get<T>(key: string, defaultValue?: T) {
    const v = this._values[key];
    if (v === undefined && defaultValue) {
      return defaultValue;
    }
    return v as T;
  }
}
