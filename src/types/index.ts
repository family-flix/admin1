// import { Response } from "@list-helper/core/typing";

import { Application } from "@/domains/app";
import { NavigatorCore } from "@/domains/navigator";
import { ViewCore } from "@/domains/router";
import { JSX } from "solid-js/jsx-runtime";

export type Resp<T> = {
  data: T extends null ? null : T;
  error: T extends null ? Error : null;
};
export type Result<T> = Resp<T> | Resp<null>;
export type UnpackedResult<T> = NonNullable<
  T extends Resp<infer U> ? (U extends null ? U : U) : T
>;
/** 构造一个结果对象 */
export const Result = {
  /** 构造成功结果 */
  Ok: <T>(value: T) => {
    const result = {
      data: value,
      error: null,
    } as Result<T>;
    return result;
  },
  /** 构造失败结果 */
  Err: <T>(message: string | Error | Result<null>) => {
    const result = {
      data: null,
      error: (() => {
        if (typeof message === "string") {
          return new Error(message);
        }
        if (typeof message === "object") {
          return message;
        }
        const r = message as Result<null>;
        return r.error;
      })(),
    } as Result<null>;
    return result;
  },
};

export type Unpacked<T> = T extends (infer U)[]
  ? U
  : T extends (...args: any[]) => infer U
  ? U
  : T extends Promise<infer U>
  ? U
  : T extends Result<infer U>
  ? U
  : T;

export type BaseApiResp<T> = {
  code: number;
  msg: string;
  data: T;
};

export type ListResponse<T> = {
  total: number;
  page: number;
  page_size: number;
  list: T[];
};

export type RequestedResource<T extends (...args: any[]) => any> =
  UnpackedResult<Unpacked<ReturnType<T>>>;

export type ViewComponent = (props: {
  app: Application;
  router: NavigatorCore;
  view: ViewCore;
}) => JSX.Element;
