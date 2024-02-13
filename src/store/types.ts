import { JSX } from "solid-js/jsx-runtime";

import { Application } from "@/domains/app";
import { HistoryCore } from "@/domains/history";
import { RouteViewCore } from "@/domains/route_view";
import { ScrollViewCore } from "@/domains/ui";
import { StorageCore } from "@/domains/storage";
import { HttpClientCore } from "@/domains/http_client";

import { PageKeys, RouteConfig } from "./routes";
import { storage } from "./storage";

export type GlobalStorageValues = (typeof storage)["values"];
export type ViewComponentProps = {
  app: Application;
  history: HistoryCore<PageKeys, RouteConfig>;
  client: HttpClientCore;
  view: RouteViewCore;
  storage: StorageCore<GlobalStorageValues>;
  pages: Omit<Record<PageKeys, ViewComponent>, "root">;
  parent?: {
    view: RouteViewCore;
    scrollView?: ScrollViewCore;
  };
};
export type ViewComponent = (props: ViewComponentProps) => JSX.Element;
