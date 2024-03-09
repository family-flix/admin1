import axios from "axios";

import { HttpClientCore } from "./index";

export function connect(store: HttpClientCore) {
  store.fetch = (options) => {
    const { url, method, data, headers } = options;
    if (method === "GET") {
      return axios.get(url, {
        headers: {
          ...headers,
        },
      });
    }
    if (method === "POST") {
      return axios.post(url, data, {
        headers: {
          ...headers,
        },
      });
    }
    return Promise.reject("unknown method");
  };
}
