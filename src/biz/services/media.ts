import { media_request } from "@/biz/requests/index";
import { ListResponseWithCursor } from "@/biz/requests/types";
import { FetchParams } from "@/domains/list/typing";
import { Result, UnpackedResult } from "@/domains/result/index";
import { TmpRequestResp, RequestedResource } from "@/domains/request/utils";
import {
  MediaErrorTypes,
  MediaOriginCountries,
  MediaTypes,
  MovieMediaOriginCountryTextMap,
  SeasonMediaOriginCountryTextMap,
} from "@/constants/index";

import { processMediaPrepareArchive } from "./utils";

/** 获取季列表 */
export function fetchSeasonMediaList(params: FetchParams & Partial<{ name: string }>) {
  const { page, pageSize, ...rest } = params;
  return media_request.post<
    ListResponseWithCursor<{
      id: string;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      air_date: string;
      vote_average: string;
      episode_count: number;
      cur_episode_count: number;
      origin_country: string[];
      genres: { value: string; label: string }[];
      tips: string[];
    }>
  >("/api/v2/admin/season/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
}
export type SeasonMediaItem = NonNullable<UnpackedResult<TmpRequestResp<typeof fetchSeasonMediaList>>>["list"][number];

/**
 * 获取电视剧详情
 */
export function fetchSeasonMediaProfile(body: { season_id: string }) {
  const { season_id } = body;
  return media_request.post<{
    id: string;
    name: string;
    overview: string;
    poster_path: null;
    backdrop_path: null;
    air_date: string;
    size_count: number;
    genres: { value: string; label: string }[];
    origin_country: MediaOriginCountries[];
    /** 同系列电视剧列表 */
    series: {
      id: string;
      name: string;
      season_number: number;
      poster_path: string;
      air_date: string;
      overview: string;
    }[];
    episodes: {
      id: string;
      name: string;
      overview: string;
      episode_number: number;
      air_date: string;
      runtime: number;
      sources: {
        id: string;
        file_id: string;
        file_name: string;
        parent_paths: string;
        size: number;
        created: string;
        drive: {
          id: string;
          name: string;
          avatar: string;
        };
      }[];
    }[];
    profile_id: string;
  }>("/api/v2/admin/season/profile", {
    season_id,
  });
}
export type SeasonMediaProfile = RequestedResource<typeof fetchSeasonMediaProfileProcess>;
export type MediaProfile = RequestedResource<typeof fetchSeasonMediaProfileProcess>["episodes"][number];
export function fetchSeasonMediaProfileProcess(r: TmpRequestResp<typeof fetchSeasonMediaProfile>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  const {
    id,
    name,
    overview,
    poster_path,
    backdrop_path,
    air_date,
    genres,
    origin_country,
    episodes,
    series,
    profile_id,
  } = r.data;
  return Result.Ok({
    id,
    name,
    overview,
    poster_path,
    backdrop_path,
    air_date,
    series,
    origin_country: origin_country
      .map((country) => {
        return SeasonMediaOriginCountryTextMap[country];
      })
      .filter(Boolean)
      .join("、"),
    episodes,
    profile_id,
  });
}

/**
 * 获取电影列表
 */
export function fetchMovieMediaList(params: FetchParams & { name: string; duplicated: number }) {
  const { page, pageSize, ...rest } = params;
  return media_request.post<
    ListResponseWithCursor<{
      id: string;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      air_date: string;
      vote_average: number;
      runtime: number;
      genres: { value: string; label: string }[];
      origin_country: MediaOriginCountries[];
      tips: string[];
      persons: {
        id: string;
        name: string;
        profile_path: string;
        order: number;
      }[];
    }>
  >("/api/v2/admin/movie/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
}
export type MovieMediaItem = RequestedResource<typeof fetchMovieMediaListProcess>["list"][number];
export function fetchMovieMediaListProcess(r: TmpRequestResp<typeof fetchMovieMediaList>) {
  if (r.error) {
    return r;
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((movie) => {
      const { persons = [], genres, origin_country, ...rest } = movie;
      return {
        ...rest,
        origin_country: origin_country
          .map((country) => {
            return MovieMediaOriginCountryTextMap[country];
          })
          .filter(Boolean)
          .join("、"),
        persons: persons.slice(0, 5),
      };
    }),
  });
}

/**
 * 获取电影详情
 */
export function fetchMovieMediaProfile(body: { movie_id: string }) {
  const { movie_id } = body;
  return media_request.post<{
    id: string;
    name: string;
    overview: string;
    poster_path: null;
    backdrop_path: null;
    air_date: string;
    sources: {
      id: string;
      file_id: string;
      file_name: string;
      parent_paths: string;
      size: number;
      drive: {
        id: string;
        name: string;
        avatar: string;
      };
    }[];
  }>("/api/v2/admin/movie/profile", {
    media_id: movie_id,
  });
}
export type MovieProfile = RequestedResource<typeof fetchMovieMediaProfileProcess>;
export function fetchMovieMediaProfileProcess(r: TmpRequestResp<typeof fetchMovieMediaProfile>) {
  if (r.error) {
    return Result.Err(r.error.message);
  }
  const { id, name, overview, poster_path, backdrop_path, air_date, sources } = r.data;
  return Result.Ok({
    id,
    name,
    overview,
    poster_path,
    backdrop_path,
    air_date,
    sources,
  });
}
/*
 * 获取电视剧部分详情
 */
export function fetchPartialSeasonMedia(params: { media_id: string }) {
  const { media_id } = params;
  return media_request.post<{
    id: string;
    name: string;
    original_name: string;
    overview: string;
    poster_path: string;
    air_date: string;
    vote_average: string;
    episode_count: number;
    cur_episode_count: number;
    origin_country: string[];
    genres: { value: string; label: string }[];
    tips: string[];
  }>("/api/v2/admin/season/partial", {
    media_id,
  });
}
/**
 * 刷新电影详情
 */
export function refreshMediaProfile(body: { media_id: string }) {
  const { media_id } = body;
  return media_request.post<{ job_id: string }>("/api/v2/admin/media/refresh_profile", {
    media_id,
  });
}
/**
 * 改变电视剧详情
 */
export function setMediaProfile(body: {
  media_id: string;
  media_profile: { id: string; type: MediaTypes; name: string };
}) {
  const { media_id, media_profile } = body;
  return media_request.post<void>("/api/v2/admin/media/set_profile", {
    media_id,
    media_profile,
  });
}
export type MediaSource = {
  id: string;
  file_id: string;
  file_name: string;
  parent_paths: string;
  size: number;
};
export type MediaPrepareArchiveItemResp = {
  id: string;
  type: MediaTypes;
  name: string;
  poster_path: string;
  air_date: string;
  episode_count: number | null;
  cur_episode_count: number | null;
  sources: {
    id: string;
    name: string;
    order: number;
    files: {
      id: string;
      file_id: string;
      file_name: string;
      parent_paths: string;
      size: number;
      drive: {
        id: string;
        name: string;
        type: number;
      };
    }[];
  }[];
};
/**
 * 获取可以归档的季列表
 */
export function fetchMediaListPrepareArchive(params: FetchParams & Partial<{ name: string; drive_ids: string }>) {
  const { page, pageSize, ...rest } = params;
  return media_request.post<ListResponseWithCursor<MediaPrepareArchiveItemResp>>("/api/v2/admin/media/archive/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
}
export function fetchMediaListPrepareArchiveProcess(r: TmpRequestResp<typeof fetchMediaListPrepareArchive>) {
  if (r.error) {
    return Result.Err(r.error.message);
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((item) => {
      return processMediaPrepareArchive(item);
    }),
  });
}
export type MediaPrepareArchiveItem = RequestedResource<typeof fetchMediaListPrepareArchiveProcess>["list"][number];
/**
 * 获取可以归档的影视剧
 */
export function fetchPartialMediaPrepareArchive(body: { media_id: string }) {
  const { media_id } = body;
  return media_request.post<MediaPrepareArchiveItemResp>("/api/v2/admin/media/archive/partial", {
    media_id,
  });
}
export function fetchPartialMediaPrepareArchiveProcess(r: TmpRequestResp<typeof fetchPartialMediaPrepareArchive>) {
  if (r.error) {
    return Result.Err(r.error.message);
  }
  return Result.Ok(processMediaPrepareArchive(r.data));
}
/**
 * 删除电视剧/电影
 */
export function deleteMedia(body: { media_id: string }) {
  const { media_id } = body;
  return media_request.post("/api/v2/admin/media/delete", {
    media_id,
  });
}

type SeasonError = {
  id: string;
  name: string | null;
  poster_path: string | null;
  tv_id: string;
  season_text: string;
  texts: string[];
};
type EpisodeError = {
  id: string;
  name: string | null;
  poster_path: string | null;
  tv_id: string;
  season_id: string;
  season_text: string;
  episode_text: string;
  texts: string[];
};
type MovieError = {
  id: string;
  name: string | null;
  poster_path: string | null;
  texts: string[];
};
/**
 * 获取存在问题的影视剧列表
 */
export function fetchInvalidMediaList(body: FetchParams) {
  return media_request.post<
    ListResponseWithCursor<{
      id: string;
      type: MediaErrorTypes;
      media: {
        id: string;
        type: MediaTypes;
        name: string;
        poster_path: string;
      };
      tips: string[];
    }>
  >("/api/v2/admin/media/invalid", body);
}
export type MediaErrorItem = NonNullable<UnpackedResult<TmpRequestResp<typeof fetchInvalidMediaList>>>["list"][number];
/**
 * 转存指定季到指定云盘
 */
export function transferMediaToAnotherDrive(body: { media_id: string; to_drive_id: string }) {
  const { media_id, to_drive_id } = body;
  return media_request.post<{ job_id: string }>("/api/v2/admin/media/transfer", {
    media_id,
    to_drive_id,
  });
}
/**
 * 转存指定季到对应资源盘
 * 只有阿里云盘支持
 */
export function transferMediaToResourceDrive(body: { media_id: string }) {
  const { media_id } = body;
  return media_request.post<{ job_id: string }>("/api/v2/admin/media/to_resource_drive", {
    media_id,
  });
}
/**
 * 获取指定电视剧、指定季下的剧集，支持分页
 */
export function fetchEpisodesOfSeason(body: { media_id: string } & FetchParams) {
  const { media_id, page, pageSize, next_marker } = body;
  return media_request.post<
    ListResponseWithCursor<{
      id: string;
      name: string;
      overview: string;
      episode_number: string;
      first_air_date: string;
      runtime: number;
      sources: {
        id: string;
        file_id: string;
        file_name: string;
        parent_paths: string;
        size: number;
        drive: {
          id: string;
          name: string;
          avatar: string;
        };
      }[];
    }>
  >("/api/v2/admin/media_source/list", {
    media_id,
    page,
    next_marker,
    page_size: pageSize,
  });
}
export type EpisodeItemInSeason = NonNullable<
  UnpackedResult<TmpRequestResp<typeof fetchEpisodesOfSeason>>
>["list"][number];
