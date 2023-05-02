import { JSX } from "solid-js/jsx-runtime";

const CollectionProvider = (props: { children: JSX.Element }) => {
  return props.children;
};
const CollectionSlot = (props: { children: JSX.Element }) => {
  return props.children;
};
const CollectionItemSlot = (props: { children: JSX.Element }) => {
  return props.children;
};

const Provider = CollectionProvider;
const Slot = CollectionSlot;
const Item = CollectionItemSlot;

export { Provider, Slot, Item };
