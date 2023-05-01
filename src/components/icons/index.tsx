/**
 * @file 给图标的容器
 */
import { JSX } from "solid-js/jsx-runtime";

export const IconWrap = (props: { spin?: boolean; children: JSX.Element }) => {
  const { spin, children } = props;
  return (
    <div
      classList={{
        "p-2 rounded-lg hover:opacity-80 hover:bg-slate-200 cursor-pointer":
          true,
        "animate-spin": spin,
      }}
    >
      {children}
    </div>
  );
};
