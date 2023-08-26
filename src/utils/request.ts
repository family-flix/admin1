/**
 * @file 客户端请求库
 */
import axios, { AxiosError, CancelToken, CancelTokenSource } from "axios";
import qs from "qs";

import { JSONObject, Result } from "@/types";
import { app } from "@/store/app";

const client = axios.create({
  timeout: 6000,
});
type RequestClient = {
  get: <T>(
    url: string,
    query?: JSONObject,
    config?: Partial<{ headers: Record<string, string> }>
  ) => Promise<Result<T>>;
  post: <T>(
    url: string,
    body: JSONObject | FormData,
    config?: Partial<{ headers: Record<string, string> }>
  ) => Promise<Result<T>>;
};
export const request = {
  get: async (endpoint, query, config = {}) => {
    try {
      const url = `${endpoint}${query ? "?" + qs.stringify(query) : ""}`;
      const resp = await client.get<{ code: number | string; msg: string; data: unknown | null }>(url, {
        headers: {
          ...(config.headers || {}),
          Authorization: app.user.token,
        },
      });
      const { code, msg, data } = resp.data;
      if (code !== 0) {
        return Result.Err(msg, code, data);
      }
      console.log(data);
      return Result.Ok(data);
    } catch (err) {
      const { response, message } = err as AxiosError;
      console.log("error", message);
      return Result.Err(message);
    }
  },
  post: async (url, body, config = {}) => {
    try {
      const resp = await client.post<{ code: number | string; msg: string; data: unknown | null }>(url, body, {
        headers: {
          ...(config.headers || {}),
          Authorization: app.user.token,
        },
      });
      const { code, msg, data } = resp.data;
      if (code !== 0) {
        return Result.Err(msg, code, data);
      }
      return Result.Ok(data);
    } catch (err) {
      const error = err as AxiosError;
      const { response, message } = error;
      return Result.Err(message);
    }
  },
} as RequestClient;
