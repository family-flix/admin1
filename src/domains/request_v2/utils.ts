/**
 * @file 构建 http 请求载荷
 * 实际请求由 http client 完成
 */
import { RequestedResource, Result, JSONObject } from "@/types";
import { query_stringify } from "@/utils";

export type RequestPayload<T> = {
  url: string;
  method?: "POST" | "GET" | "DELETE" | "PUT";
  query?: any;
  params?: any;
  body?: any;
  headers?: Record<string, string>;
  defaultResponse?: T;
  process?: (v: T) => T;
};
export type UnpackedRequestPayload<T> = NonNullable<T extends RequestPayload<infer U> ? (U extends null ? U : U) : T>;
export type TmpRequestResp<T extends (...args: any[]) => any> = Result<UnpackedRequestPayload<RequestedResource<T>>>;

export const request = {
  /** 构建请求参数 */
  get<T>(
    endpoint: string,
    query?: JSONObject,
    extra: Partial<{
      process: () => void;
      defaultResponse: T;
    }> = {}
  ) {
    const { defaultResponse } = extra;
    const url = `${endpoint}${query ? "?" + query_stringify(query) : ""}`;
    const resp = {
      url,
      method: "GET",
      defaultResponse,
      headers: {},
    } as RequestPayload<T>;
    return resp;
  },
  /** 构建请求参数 */
  post<T>(
    url: string,
    body?: Record<string, unknown>,
    extra: Partial<{
      process: () => void;
      defaultResponse: T;
    }> = {}
  ) {
    const { defaultResponse } = extra;
    const resp = {
      url,
      method: "POST",
      body,
      defaultResponse,
      headers: {},
    } as RequestPayload<T>;
    return resp;
  },
};
