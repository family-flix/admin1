/**
 * @file 客户端请求库
 */
import axios, { AxiosError } from "axios";
import qs from "qs";

import { JSONObject, Result } from "@/types";
import { app } from "@/store/app";

import dayjs from "dayjs";

const client = axios.create({
  timeout: 6000,
  // baseURL: "https://api.funzm.com",
});
type RequestClient = {
  get: <T>(url: string, query?: JSONObject) => Promise<Result<T>>;
  post: <T>(url: string, body: JSONObject) => Promise<Result<T>>;
};
export const request = {
  get: async (endpoint, query) => {
    try {
      const url = `${endpoint}${query ? "?" + qs.stringify(query) : ""}`;
      const resp = await client.get(url, {
        headers: {
          Authorization: app.user.token,
        },
      });
      const { code, msg, data } = resp.data;
      if (code !== 0) {
        return Result.Err(msg);
      }
      return Result.Ok(data);
    } catch (err) {
      const { response, message } = err as AxiosError;
      return Result.Err(message);
    }
  },
  post: async (url, body) => {
    try {
      const resp = await client.post(url, body, {
        headers: {
          Authorization: app.user.token,
        },
      });
      const { code, msg, data } = resp.data;
      if (code !== 0) {
        return Result.Err(msg);
      }
      return Result.Ok(data);
    } catch (err) {
      const error = err as AxiosError;
      const { response, message } = error;
      return Result.Err(message);
    }
  },
} as RequestClient;
