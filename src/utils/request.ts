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
  get: <T>(url: string, query?: JSONObject, token?: CancelToken) => Promise<Result<T>>;
  post: <T>(url: string, body: JSONObject, token?: CancelToken) => Promise<Result<T>>;
};
export const request = {
  get: async (endpoint, query, token) => {
    try {
      const url = `${endpoint}${query ? "?" + qs.stringify(query) : ""}`;
      const resp = await client.get<{ code: number | string; msg: string; data: unknown | null }>(url, {
        cancelToken: token,
        headers: {
          Authorization: app.user.token,
        },
      });
      const { code, msg, data } = resp.data;
      if (code !== 0) {
        return Result.Err(msg, code, data);
      }
      return Result.Ok(data);
    } catch (err) {
      const { response, message } = err as AxiosError;
      return Result.Err(message);
    }
  },
  post: async (url, body, token) => {
    try {
      const resp = await client.post<{ code: number | string; msg: string; data: unknown | null }>(url, body, {
        cancelToken: token,
        headers: {
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
