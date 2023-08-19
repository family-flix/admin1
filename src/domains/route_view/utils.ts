import { query_stringify } from "@/utils";
import { JSONObject } from "@/types";

export function buildUrl(key: string, params?: JSONObject, query?: Parameters<typeof query_stringify>[0]) {
  const search = (() => {
    if (!query || Object.keys(query).length === 0) {
      return "";
    }
    return "?" + query_stringify(query);
  })();
  const url = (() => {
    if (!key.match(/:[a-z]{1,}/)) {
      return key + search;
    }
    if (!params || Object.keys(params).length === 0) {
      return key + search;
    }
    return (
      key.replace(/:([a-z]{1,})/g, (...args: string[]) => {
        const [, field] = args;
        const value = String(params[field] || "");
        return value;
      }) + search
    );
  })();
  return url;
}
