export type ValueInputInterface<T> = {
  value: T;
  setValue: (v: T) => void;
  onChange: (fn: (v: T) => void) => void;
};
