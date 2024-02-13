import { StorageCore } from "@/domains/storage";

const DEFAULT_CACHE_VALUES = {
  user: {
    id: "",
    username: "anonymous",
    token: "",
    avatar: "",
  },
  jobs: [] as string[],
};
const key = "a_global";
const e = globalThis.localStorage.getItem(key);
export const storage = new StorageCore<typeof DEFAULT_CACHE_VALUES>({
  key,
  values: e ? JSON.parse(e) : DEFAULT_CACHE_VALUES,
  client: globalThis.localStorage,
});
