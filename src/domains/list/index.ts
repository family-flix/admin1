/**
 * @file 分页领域
 */
import { JSONValue, Result } from "@/types";
import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";

import {
  DEFAULT_RESPONSE,
  DEFAULT_PARAMS,
  DEFAULT_CURRENT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_TOTAL,
} from "./constants";
import { omit } from "./utils";
import {
  OriginalResponse,
  FetchParams,
  Response,
  Search,
  ParamsProcessor,
  ListProps,
} from "./typing";

/**
 * 只处理
 * @param originalResponse
 * @returns
 */
const RESPONSE_PROCESSOR = <T>(originalResponse: OriginalResponse) => {
  try {
    const data = originalResponse.data || originalResponse;
    const { list, page, pageSize, total, isEnd } = data as {
      list: T[];
      page: number;
      pageSize: number;
      total: number;
      isEnd: boolean;
    };
    const result = {
      dataSource: list,
      page,
      pageSize,
      total,
      noMore: false,
      error: null,
    };
    if (total <= pageSize * page) {
      result.noMore = true;
    }
    if (isEnd !== undefined) {
      result.noMore = isEnd;
    }
    return result;
  } catch (error) {
    return {
      dataSource: [],
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      total: DEFAULT_TOTAL,
      noMore: false,
      error: new Error(
        `process response fail, because ${(error as Error).message}`
      ),
    };
  }
};
type ServiceFn = (...args: JSONValue[]) => Promise<Result<OriginalResponse>>;
enum Events {
  LoadingChange,
  ParamsChange,
  DataSourceAdded,
  StateChange,
}
type TheTypesOfEvents<T> = {
  [Events.LoadingChange]: boolean;
  [Events.ParamsChange]: FetchParams;
  [Events.DataSourceAdded]: unknown[];
  [Events.StateChange]: ListState<T>;
};
interface ListState<T> extends Response<T> {}

/**
 * 分页类
 */
export class ListCore<T extends Record<string, unknown>> extends BaseDomain<
  TheTypesOfEvents<T>
> {
  debug: boolean = false;

  static defaultResponse = <T>() => {
    return { ...DEFAULT_RESPONSE } as Response<T>;
  };
  static commonProcessor = RESPONSE_PROCESSOR;

  /** 原始请求方法 */
  private originalFetch: ServiceFn;
  // private originalFetch: (...args: unknown[]) => Promise<OriginalResponse>;
  /** 支持请求前对参数进行处理（formToBody） */
  private beforeRequest: ParamsProcessor = (currentParams, prevParams) => {
    return { ...prevParams, ...currentParams };
  };
  /** 响应处理器 */
  private processor = ListCore.commonProcessor;
  /** 初始查询参数 */
  private initialParams: FetchParams;
  private extraResponse: Record<string, unknown>;
  private params: FetchParams = { ...DEFAULT_PARAMS };

  // 响应数据
  response: Response<T> = { ...DEFAULT_RESPONSE };
  rowKey: string;

  constructor(fetch: ServiceFn, options: ListProps<T> = {}) {
    super();

    if (typeof fetch !== "function") {
      throw new Error("fetch must be a function");
    }

    const {
      debug,
      rowKey = "id",
      beforeRequest,
      processor,
      extraDefaultResponse,
    } = options;
    this.debug = !!debug;
    this.rowKey = rowKey;
    this.originalFetch = fetch;
    if (processor) {
      this.processor = (originalResponse) => {
        const nextResponse = {
          ...this.response,
          ...ListCore.commonProcessor<T>(originalResponse),
        } as Response<T>;
        return processor<T>(nextResponse, originalResponse);
      };
    }
    if (beforeRequest !== undefined) {
      this.beforeRequest = beforeRequest;
    }
    this.initialParams = { ...DEFAULT_PARAMS } as FetchParams;
    this.extraResponse = {
      ...extraDefaultResponse,
    };
    this.initialize(options);
  }
  private initialize = (options) => {
    const { search, dataSource, page, pageSize } = options;

    if (search !== undefined) {
      this.initialParams = {
        ...this.initialParams,
        ...search,
      };
      this.extraResponse.search = search;
    }
    if (dataSource !== undefined) {
      this.extraResponse.dataSource = dataSource;
    }
    if (page !== undefined) {
      this.initialParams.page = page;
      this.extraResponse.page = page;
    }
    if (pageSize !== undefined) {
      this.initialParams.pageSize = pageSize;
      this.extraResponse.pageSize = pageSize;
    }
    this.params = { ...this.initialParams };
    this.response = {
      ...ListCore.defaultResponse(),
      ...this.extraResponse,
    };
    const { page: p, pageSize: ps, ...restParams } = this.params;
    const responseFromPlugin: Partial<FetchParams> = {
      search: restParams,
    };
    if (p) {
      responseFromPlugin.page = p;
    }
    if (ps) {
      responseFromPlugin.pageSize = ps;
    }
    this.response = {
      ...this.response,
      ...responseFromPlugin,
      search: {
        ...this.response.search,
        ...responseFromPlugin.search,
      },
    };
  };
  /**
   * 手动修改当前实例的查询参数
   * @param {import('./typing').FetchParams} nextParams 查询参数或设置函数
   */
  setParams = (nextParams) => {
    let result = nextParams;
    if (typeof nextParams === "function") {
      result = nextParams(this.params);
    }
    this.params = result;
    this.emit(Events.ParamsChange, { ...this.params });
  };
  /**
   * 调用接口进行请求
   * 外部不应该直接调用该方法
   * @param {import('./typing').FetchParams} nextParams - 查询参数
   */
  fetch = async (params = {}) => {
    this.response.error = null;
    this.response.loading = true;
    this.emit(Events.LoadingChange, true);
    this.emit(Events.StateChange, { ...this.response });
    const mergedParams = {
      ...this.params,
      ...params,
    };
    let processedParams = this.beforeRequest({ ...mergedParams }, this.params);
    if (processedParams === undefined) {
      processedParams = mergedParams;
    }
    const res = await this.originalFetch(processedParams);
    this.response.loading = false;
    this.response.search = omit({ ...mergedParams }, ["page", "pageSize"]);
    this.params = { ...processedParams };
    this.emit(Events.ParamsChange, { ...this.params });
    if (res.error) {
      return Result.Err(res.error);
    }
    const originalResponse = res.data;
    let response = this.processor<T>(originalResponse);
    if (response === undefined) {
      response = ListCore.commonProcessor(originalResponse);
    }
    // console.log(...this.log('3、afterProcessor', response));
    const responseIsEmpty = response.dataSource === undefined;
    if (responseIsEmpty) {
      response.dataSource = [];
    }
    return Result.Ok(response);
  };
  /**
   * 使用初始参数请求一次，初始化时请调用该方法
   */
  init = async (params = {}) => {
    const res = await this.fetch({
      ...this.initialParams,
      ...params,
    });
    this.response.initial = false;
    if (res.error) {
      this.tip({ icon: "error", text: [res.error.message] });
      this.response.error = res.error;
      this.emit(Events.StateChange, { ...this.response });
      return Result.Err(res.error);
    }
    this.response = {
      ...this.response,
      ...res.data,
    };
    this.emit(Events.StateChange, { ...this.response });
    this.emit(Events.DataSourceAdded, [...res.data.dataSource]);
    return Result.Ok({ ...this.response });
  };
  /**
   * 下一页
   */
  next = async () => {
    const { page, ...restParams } = this.params;
    const res = await this.fetch({
      ...restParams,
      page: page + 1,
    });
    if (res.error) {
      this.tip({ icon: "error", text: [res.error.message] });
      this.response.error = res.error;
      this.emit(Events.StateChange, { ...this.response });
      return Result.Err(res.error);
    }
    this.response = {
      ...this.response,
      ...res.data,
    };
    this.emit(Events.StateChange, { ...this.response });
    return Result.Ok({ ...this.response });
  };
  /**
   * 返回上一页
   */
  prev = async () => {
    const { page, ...restParams } = this.params;
    const res = await this.fetch({
      ...restParams,
      page: (() => {
        if (page <= DEFAULT_CURRENT_PAGE) {
          return DEFAULT_CURRENT_PAGE;
        }
        return page - 1;
      })(),
    });
    if (res.error) {
      this.tip({ icon: "error", text: [res.error.message] });
      this.response.error = res.error;
      this.emit(Events.StateChange, { ...this.response });
      return Result.Err(res.error);
    }
    this.response = {
      ...this.response,
      ...res.data,
    };
    this.emit(Events.StateChange, { ...this.response });
    return Result.Ok({ ...this.response });
  };
  /**
   * 无限加载时使用的下一页
   */
  loadMore = async () => {
    if (this.response.loading || this.response.noMore) {
      return;
    }
    const { page, ...restParams } = this.params;
    const res = await this.fetch({
      ...restParams,
      page: page + 1,
    });
    if (res.error) {
      this.tip({ icon: "error", text: [res.error.message] });
      this.response.error = res.error;
      this.emit(Events.StateChange, { ...this.response });
      return Result.Err(res.error);
    }
    const prevItems = this.response.dataSource;
    this.response = {
      ...this.response,
      ...res.data,
    };
    this.response.dataSource = prevItems.concat(res.data.dataSource);
    this.emit(Events.DataSourceAdded, [...res.data.dataSource]);
    this.emit(Events.StateChange, { ...this.response });
    return Result.Ok({ ...this.response });
  };
  /**
   * 前往指定页码
   * @param {number} page - 要前往的页码
   * @param {number} [pageSize] - 每页数量
   */
  goto = async (targetPage, targetPageSize) => {
    const { page, pageSize, ...restParams } = this.params;
    const res = await this.fetch({
      ...restParams,
      page: (() => {
        if (targetPage <= DEFAULT_CURRENT_PAGE) {
          return DEFAULT_CURRENT_PAGE;
        }
        return targetPage;
      })(),
      pageSize: (() => {
        if (targetPageSize !== undefined) {
          return targetPageSize;
        }
        return pageSize;
      })(),
    });
    if (res.error) {
      this.tip({ icon: "error", text: [res.error.message] });
      this.response.error = res.error;
      this.emit(Events.StateChange, { ...this.response });
      return Result.Err(res.error);
    }
    this.response = {
      ...this.response,
      ...res.data,
    };
    this.emit(Events.StateChange, { ...this.response });
    return Result.Ok({ ...this.response });
  };
  search = async (params: Search) => {
    const res = await this.fetch({
      ...this.initialParams,
      ...params,
    });
    if (res.error) {
      this.tip({ icon: "error", text: [res.error.message] });
      this.response.error = res.error;
      this.emit(Events.StateChange, { ...this.response });
      return Result.Err(res.error);
    }
    this.response = {
      ...this.response,
      ...res.data,
    };
    this.emit(Events.StateChange, { ...this.response });
    return Result.Ok({ ...this.response });
  };
  /**
   * 使用初始参数请求一次，「重置」操作时调用该方法
   */
  reset = async (params: Partial<FetchParams> = {}) => {
    /** 由于在 fetch 内会合并 this.params 和 params，所以这里先将 this.params 给重置掉 */
    this.params = { ...this.initialParams };
    const res = await this.fetch(params);
    if (res.error) {
      this.tip({ icon: "error", text: [res.error.message] });
      this.response.error = res.error;
      this.emit(Events.StateChange, { ...this.response });
      return Result.Err(res.error);
    }
    this.response = {
      ...this.response,
      ...res.data,
    };
    this.emit(Events.StateChange, { ...this.response });
    return Result.Ok({ ...this.response });
  };
  /**
   * 使用当前参数重新请求一次，PC 端「刷新」操作时调用该方法
   */
  reload = () => {
    return this.fetch({});
  };
  /**
   * 页码置为 1，其他参数保留，重新请求一次。移动端「刷新」操作时调用该方法
   */
  refresh = async () => {
    const { page, ...restParams } = this.params;
    this.response.refreshing = true;
    this.emit(Events.StateChange, { ...this.response });
    const res = await this.fetch({
      restParams,
      page: 1,
    });
    this.response.refreshing = false;
    if (res.error) {
      this.tip({ icon: "error", text: [res.error.message] });
      this.response.error = res.error;
      this.emit(Events.StateChange, { ...this.response });
      return Result.Err(res.error);
    }
    this.response = {
      ...this.response,
      ...res.data,
    };
    this.emit(Events.StateChange, { ...this.response });
    return Result.Ok({ ...this.response });
  };
  /**
   * 移除列表中的多项（用在删除场景）
   * @param {T[]} items 要删除的元素列表
   */
  deleteItems = async (items) => {
    const { dataSource } = this.response;
    const nextDataSource = dataSource.filter((item) => {
      return !items.includes(item);
    });
    this.response.total = nextDataSource.length;
    this.response.dataSource = nextDataSource;
    this.emit(Events.StateChange, { ...this.response });
  };
  /**
   * 手动修改当前 response
   * @param fn
   */
  modifyResponse = (fn: (v: Response<T>) => Response<T>) => {
    this.response = fn({ ...this.response });
    this.emit(Events.StateChange, { ...this.response });
  };
  /**
   * 手动修改当前 params
   */
  modifyParams = (fn: (v: FetchParams) => FetchParams) => {
    this.params = fn(this.params);
    this.emit(Events.ParamsChange, { ...this.params });
  };
  /**
   * 手动修改当前 search
   */
  modifySearch = (fn) => {
    this.params = {
      ...fn(omit(this.params, ["page", "pageSize"])),
      page: this.params.page,
      pageSize: this.params.pageSize,
    };
    this.emit(Events.ParamsChange, { ...this.params });
  };

  onStateChange(handler: Handler<TheTypesOfEvents<T>[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
  onLoadingChange = (
    handler: Handler<TheTypesOfEvents<T>[Events.LoadingChange]>
  ) => {
    this.on(Events.LoadingChange, handler);
  };
  onDataSourceAdded = (
    handler: Handler<TheTypesOfEvents<T>[Events.DataSourceAdded]>
  ) => {
    this.on(Events.DataSourceAdded, handler);
  };
}
