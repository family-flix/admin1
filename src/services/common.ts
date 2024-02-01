import { MediaTypes } from "@/constants";
import { FetchParams } from "@/domains/list/typing";
import { ListResponseWithCursor, RequestedResource, Result } from "@/types";
import { request } from "@/store/request";

/**
 * 搜索影视剧详情
 * @param params
 * @returns
 */
export async function searchMediaProfile(
  params: Partial<FetchParams> & Partial<{ keyword: string; type: MediaTypes; series_id: string }>
) {
  const { keyword, page, pageSize, type, ...rest } = params;
  const r = await request.post<
    ListResponseWithCursor<{
      id: string;
      type: MediaTypes;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      air_date: string;
      sources: {
        id: string;
        name: string;
        overview: string;
        order: number;
        air_date: string;
      }[];
    }>
  >(`/api/v2/common/search`, {
    ...rest,
    keyword,
    page,
    page_size: pageSize,
    type,
  });
  if (r.error) {
    return Result.Err(r.error.message);
  }
  const { next_marker, list } = r.data;
  return Result.Ok({
    list: list.map((media) => {
      if (media.type === MediaTypes.Movie) {
        const { id, name, original_name, overview, air_date, poster_path } = media;
        return {
          id,
          type: MediaTypes.Movie,
          name,
          original_name,
          overview,
          poster_path,
          air_date,
          episodes: [],
        };
      }
      const { id, name, original_name, overview, air_date, poster_path, sources } = media;
      return {
        id,
        type: MediaTypes.Season,
        name,
        original_name,
        overview,
        poster_path,
        air_date,
        episodes: sources.map((episode) => {
          const { id, name, air_date, order } = episode;
          return {
            id,
            name,
            air_date,
            order,
          };
        }),
      };
    }),
    next_marker,
  });
}
export type MediaProfileItem = RequestedResource<typeof searchMediaProfile>["list"][0];

export function fetchDashboard() {
  return request.post<{
    drive_count: number;
    drive_total_size_count: number;
    drive_total_size_count_text: string;
    drive_used_size_count: number;
    drive_used_size_count_text: string;
    movie_count: number;
    tv_count: number;
    season_count: number;
    episode_count: number;
    sync_task_count: number;
    report_count: number;
    media_request_count: number;
    invalid_season_count: number;
    invalid_movie_count: number;
    invalid_sync_task_count: number;
    updated_at: string;
  }>("/api/v2/admin/dashboard", {});
}

export function refreshDashboard() {
  return request.post("/api/v2/admin/dashboard/refresh", {});
}

export async function fetchMediaRecentlyCreated(params: FetchParams) {
  return request.post<
    ListResponseWithCursor<{
      id: string;
      media_id: string;
      name: string;
      poster_path: string;
      air_date: string;
      text: string;
    }>
  >("/api/v2/admin/dashboard/added_media", params);
}
