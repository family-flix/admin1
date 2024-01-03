import { MediaErrorTypes, MediaTypes } from "@/constants";
import { FetchParams } from "@/domains/list/typing";
import { EpisodeResolutionTypeTexts, EpisodeResolutionTypes } from "@/domains/tv/constants";
import { ListResponseWithCursor, MutableRecord, RequestedResource, Result } from "@/types";
import { request } from "@/utils/request";

/**
 * 获取无法识别的 tv
 */
export async function fetchUnknownSeasonMediaList(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  const r = await request.post<
    ListResponseWithCursor<{
      id: string;
      name: string;
      season_text: string;
      sources: {
        id: string;
        name: string;
        original_name: string;
        season_text: string;
        episode_text: string;
        file_name: string;
        parent_paths: string;
        profile: null | {};
        drive: {
          id: string;
          name: string;
        };
      }[];
    }>
  >(`/api/v2/admin/parsed_media/list`, {
    ...rest,
    type: MediaTypes.Season,
    page,
    page_size: pageSize,
  });
  if (r.error) {
    return Result.Err(r.error.message);
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((tv) => {
      const { id, name, season_text, sources } = tv;
      return {
        id,
        name,
        season_text,
        sources,
      };
    }),
  });
}
export type UnknownSeasonMediaItem = RequestedResource<typeof fetchUnknownSeasonMediaList>["list"][0];
/**
 * 获取无法识别的 tv
 */
export async function fetchUnknownMovieMediaList(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  const r = await request.post<
    ListResponseWithCursor<{
      id: string;
      name: string;
      season_text: string;
      sources: {
        id: string;
        name: string;
        original_name: string;
        season_text: string;
        episode_text: string;
        file_name: string;
        parent_paths: string;
        profile: null | {};
        drive: {
          id: string;
          name: string;
        };
      }[];
    }>
  >(`/api/v2/admin/parsed_media/list`, {
    ...rest,
    type: MediaTypes.Movie,
    page,
    page_size: pageSize,
  });
  if (r.error) {
    return Result.Err(r.error.message);
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((tv) => {
      const { id, name, season_text, sources } = tv;
      return {
        id,
        name,
        season_text,
        sources,
      };
    }),
  });
}
export type UnknownMovieMediaItem = RequestedResource<typeof fetchUnknownMovieMediaList>["list"][0];

export async function fetchParsedMediaSourceList(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  const r = await request.post<
    ListResponseWithCursor<{
      id: string;
      name: string;
      season_text: string;
      episode_text: string;
      file_name: string;
      parent_paths: string;
      profile: {
        id: string;
        name: string;
        poster_path: string;
        air_date: string;
      } | null;
      drive: {
        id: string;
        name: string;
      };
    }>
  >(`/api/v2/admin/parsed_media_source/list`, {
    ...rest,
    type: MediaTypes.Season,
    page,
    page_size: pageSize,
  });
  if (r.error) {
    return r;
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((tv) => {
      const { id, name, season_text, episode_text, file_name, parent_paths, profile, drive } = tv;
      return {
        id,
        name,
        season_text,
        episode_text,
        file_name,
        parent_paths,
        profile,
        drive,
      };
    }),
  });
}
export type UnknownEpisodeItem = RequestedResource<typeof fetchParsedMediaSourceList>["list"][0];

/** 设置未解析的影视剧详情 */
export function setParsedSeasonMediaProfile(body: {
  parsed_media_id: string;
  media_profile: { id: string; type: MediaTypes; name: string };
}) {
  const { parsed_media_id, media_profile } = body;
  return request.post<{ job_id: string }>("/api/v2/admin/parsed_media/set_profile", {
    parsed_media_id,
    media_profile,
  });
}

/** 设置未解析的影视剧详情 */
export function setParsedSeasonMediaSourceProfile(body: {
  parsed_media_source_id: string;
  media_profile: { id: string; type: MediaTypes; name: string };
}) {
  const { parsed_media_source_id, media_profile } = body;
  return request.post<void>("/api/v2/admin/parsed_media_source/set_profile", {
    parsed_media_source_id,
    media_profile,
  });
}

/** 删除解析出的影视剧记录（不删除文件） */
export function deleteParsedMediaSource(params: { parsed_media_source_id: string }) {
  const { parsed_media_source_id } = params;
  return request.post("/api/v2/admin/parsed_media_source/delete", {
    parsed_media_source_id,
  });
}

export async function fetchSourcePreviewInfo(body: { id: string }) {
  const { id } = body;
  const r = await request.post<{
    url: string;
    thumbnail: string;
    type: EpisodeResolutionTypes;
    width: number;
    height: number;
    other: {
      url: string;
      thumbnail: string;
      type: EpisodeResolutionTypes;
      width: number;
      height: number;
    }[];
  }>("/api/v2/admin/parsed_media_source/preview", {
    id,
  });
  if (r.error) {
    return Result.Err(r.error);
  }
  const { url, width, height, type, other, thumbnail } = r.data;
  return Result.Ok({
    file_id: id,
    url,
    width,
    height,
    type,
    typeText: EpisodeResolutionTypeTexts[type],
    thumbnail,
    resolutions: other.map((r) => {
      const { url, width, height, type, thumbnail } = r;
      return {
        file_id: id,
        url,
        width,
        height,
        type,
        typeText: EpisodeResolutionTypeTexts[type],
        thumbnail,
      };
    }),
  });
}
