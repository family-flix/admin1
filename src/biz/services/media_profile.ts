import { media_request } from "@/biz/requests/index";
import { ListResponse, ListResponseWithCursor } from "@/biz/requests/types";
import { TmpRequestResp, RequestedResource } from "@/domains/request/utils";
import { FetchParams } from "@/domains/list/typing";
import { Result, UnpackedResult } from "@/domains/result/index";
import { MediaTypes } from "@/constants/index";

/**
 * 搜索影视剧详情
 * @param params
 * @returns
 */
export function fetchMediaProfileList(
  params: Partial<FetchParams> & Partial<{ keyword: string; type: MediaTypes; series_id: string }>
) {
  const { keyword, page, pageSize, type, ...rest } = params;
  return media_request.post<
    ListResponseWithCursor<{
      id: string;
      type: MediaTypes;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      air_date: string;
      vote_average: number;
      source_count: number;
      sources: {
        id: string;
        name: string;
        overview: string;
        order: number;
        air_date: string;
      }[];
      genres: string[];
      origin_country: string[];
      persons: {
        id: string;
        name: string;
        role: string;
        order: number;
      }[];
    }>
  >("/api/v2/media_profile/list", {
    ...rest,
    keyword,
    page,
    page_size: pageSize,
    type,
  });
}
export type MediaProfileItem = RequestedResource<typeof fetchMediaProfileListProcess>["list"][0];
export function fetchMediaProfileListProcess(r: TmpRequestResp<typeof fetchMediaProfileList>) {
  if (r.error) {
    return Result.Err(r.error.message);
  }
  const { next_marker, list } = r.data;
  return Result.Ok({
    list: list.map((media) => {
      const {
        id,
        name,
        original_name,
        overview,
        air_date,
        poster_path,
        vote_average,
        source_count: episode_count,
        sources = [],
        genres,
        persons,
        origin_country,
      } = media;
      return {
        id,
        type: media.type,
        name,
        original_name,
        overview,
        poster_path,
        air_date,
        vote_average,
        episode_count,
        episodes:
          media.type === MediaTypes.Movie
            ? []
            : sources.map((episode) => {
                const { id, name, air_date, order } = episode;
                return {
                  id,
                  name,
                  air_date,
                  order,
                };
              }),
        genres,
        persons,
        origin_country,
      };
    }),
    next_marker,
  });
}
/**
 * 获取影视剧详情
 */
export function fetchPartialMediaProfile(body: { id: string }) {
  const { id } = body;
  return media_request.post<{
    id: string;
    type: MediaTypes;
    name: string;
    original_name: string;
    overview: string;
    poster_path: string;
    air_date: string;
    vote_average: number;
    source_count: number;
    sources: {
      id: string;
      name: string;
      overview: string;
      order: number;
      air_date: string;
    }[];
    genres: string[];
    origin_country: string[];
    persons: {
      id: string;
      name: string;
      role: string;
      order: number;
    }[];
  }>("/api/v2/media_profile/partial", {
    media_profile_id: id,
  });
}
export function fetchPartialMediaProfileProcess(r: TmpRequestResp<typeof fetchPartialMediaProfile>) {
  if (r.error) {
    return Result.Err(r.error.message);
  }
  const media = r.data;
  const {
    name,
    original_name,
    overview,
    air_date,
    vote_average,
    poster_path,
    source_count: episode_count,
    sources = [],
    genres,
    persons,
    origin_country,
  } = media;
  return Result.Ok({
    id: media.id,
    type: media.type,
    name,
    original_name,
    overview,
    poster_path,
    air_date,
    vote_average,
    episode_count,
    episodes:
      media.type === MediaTypes.Season
        ? sources.map((episode) => {
            const { id, name, air_date, order } = episode;
            return {
              id,
              name,
              air_date,
              order,
            };
          })
        : [],
    genres,
    persons,
    origin_country,
  });
}
/**
 * 删除指定影视剧详情
 */
export function deleteMediaProfile(body: { id: string }) {
  return media_request.post<ListResponse<void>>("/api/v2/media_profile/delete", {
    media_profile_id: body.id,
  });
}
/**
 * 编辑指定影视剧详情
 */
export function editMediaProfile(body: { id: string; name?: string; source_count?: number }) {
  const { id, name, source_count } = body;
  return media_request.post<ListResponse<void>>("/api/v2/media_profile/edit", {
    id,
    name,
    source_count,
  });
}
/**
 * 根据电视剧详情id，获取电视剧详情和季详情列表
 */
export function prepareSeasonList(params: { series_id: string }) {
  const { series_id } = params;
  return media_request.post<
    ListResponseWithCursor<{
      id: string | number;
      type: MediaTypes;
      name: string;
      original_name: string;
      poster_path: string;
      overview: string;
      air_date: string;
      order: number;
    }>
  >("/api/v2/media_profile/init_series", {
    series_id,
  });
}
/**
 * 根据季详情id，获取季详情信息与剧集列表
 */
export function prepareEpisodeList(params: { media_id: string | number }) {
  const { media_id } = params;
  return media_request.post<
    ListResponse<{
      id: string | number;
      type: MediaTypes;
      name: string;
      original_name: string;
      poster_path: string;
      overview: string;
      air_date: string;
      order: number;
    }>
  >("/api/v2/media_profile/init_season", {
    media_id,
  });
}

/**
 * 在 TMDB 搜索影视剧
 */
export function searchMediaInTMDB(params: Partial<FetchParams> & { keyword: string; type?: MediaTypes }) {
  const { keyword, page, pageSize, type, ...rest } = params;
  return media_request.post<
    ListResponse<{
      id: string | number;
      type: MediaTypes;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      air_date: string;
    }>
  >("/api/v2/media_profile/search_tmdb", {
    ...rest,
    keyword,
    page,
    page_size: pageSize,
    type,
  });
}
export type TheMediaInTMDB = NonNullable<UnpackedResult<TmpRequestResp<typeof searchMediaInTMDB>>>["list"][number];

/**
 * 刷新电视剧详情
 */
export function refreshMediaProfile(body: { media_id: string }) {
  const { media_id } = body;
  return media_request.post<{ job_id: string }>("/api/v2/admin/media/refresh_profile", { media_id });
}
