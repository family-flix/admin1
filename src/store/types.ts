import { JSX } from "solid-js/jsx-runtime";

import { Application } from "@/domains/app";
import { HistoryCore } from "@/domains/history";
import { PageKeys } from "./routes";
import { HttpClientCore } from "@/domains/http_client";
import { RouteViewCore } from "@/domains/route_view";
import { ScrollViewCore } from "@/domains/ui";

export type ViewComponentProps = {
  app: Application;
  // router: NavigatorCore;
  history: HistoryCore<PageKeys>;
  // request: HttpClientCore;
  view: RouteViewCore;
  parent?: { scrollView?: ScrollViewCore };
};
export type ViewComponent = (props: ViewComponentProps) => JSX.Element;
