import { client } from "@/store/request";
import {
  MediaErrorTypes,
  MediaOriginCountries,
  MediaTypes,
  MovieGenres,
  MovieMediaOriginCountryTextMap,
  SeasonMediaOriginCountryTextMap,
} from "@/constants";
import { FetchParams } from "@/domains/list/typing";
import { ListResponseWithCursor, MutableRecord, RequestedResource, Result } from "@/types";

import { processMediaPrepareArchive } from "./utils";

/** 获取季列表 */
export async function fetchSeasonMediaList(params: FetchParams & Partial<{ name: string }>) {
  const { page, pageSize, ...rest } = params;
  const r = await client.post<
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
  if (r.error) {
    return Result.Err(r.error.message);
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((tv) => {
      const { ...rest } = tv;
      return {
        ...rest,
        // updated: dayjs(updated).format("YYYY/MM/DD HH:mm"),
      };
    }),
  });
}
export type SeasonMediaItem = RequestedResource<typeof fetchSeasonMediaList>["list"][number];

export async function fetchSeasonMediaProfile(body: { season_id: string }) {
  const { season_id } = body;
  const r = await client.post<{
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
  }>("/api/v2/admin/season/profile", {
    season_id,
  });
  if (r.error) {
    return Result.Err(r.error);
  }
  const { id, name, overview, poster_path, backdrop_path, air_date, genres, origin_country, episodes, series } = r.data;
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
  });
}
export type SeasonMediaProfile = RequestedResource<typeof fetchSeasonMediaProfile>;
export type MediaSourceItem = RequestedResource<typeof fetchSeasonMediaProfile>["episodes"][number];

/**
 * 获取电影列表
 */
export async function fetchMovieMediaList(params: FetchParams & { name: string; duplicated: number }) {
  const { page, pageSize, ...rest } = params;
  const resp = await client.post<
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
  if (resp.error) {
    return resp;
  }
  return Result.Ok({
    ...resp.data,
    list: resp.data.list.map((movie) => {
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
export type MovieMediaItem = RequestedResource<typeof fetchMovieMediaList>["list"][number];

/**
 * 获取电影详情
 */
export async function fetchMovieMediaProfile(body: { movie_id: string }) {
  const { movie_id } = body;
  const r = await client.post<{
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
  if (r.error) {
    return Result.Err(r.error.message);
  }
  // const source_size_count = r.data.sources.reduce((count, cur) => {
  //   return count + cur.size;
  // }, 0);
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
export type MovieProfile = RequestedResource<typeof fetchMovieMediaProfile>;

/*
 * 获取电视剧部分详情
 */
export async function fetchPartialSeasonMedia(params: { media_id: string }) {
  const { media_id } = params;
  const r = await client.post<{
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
  }>(`/api/v2/admin/season/partial`, {
    media_id,
  });
  if (r.error) {
    return Result.Err(r.error.message);
  }
  return Result.Ok(r.data);
}

/** 刷新电影详情 */
export function refreshMediaProfile(body: { media_id: string }) {
  const { media_id } = body;
  return client.post<{ job_id: string }>("/api/v2/admin/media/refresh_profile", {
    media_id,
  });
}
/** 改变电影详情 */
export function changeMovieProfile(body: {
  movie_id: string;
  media_profile: { id: string; type: MediaTypes; name: string };
}) {
  const { movie_id, media_profile } = body;
  return client.post<{ job_id: string }>("/api/v2/admin/media/set_profile", {
    media_id: movie_id,
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
/** 获取可以归档的季列表 */
export async function fetchMediaListPrepareArchive(params: FetchParams & Partial<{ name: string; drive_ids: string }>) {
  const { page, pageSize, ...rest } = params;
  const r = await client.post<ListResponseWithCursor<MediaPrepareArchiveItemResp>>("/api/v2/admin/media/archive/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (r.error) {
    return Result.Err(r.error.message);
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map(processMediaPrepareArchive),
  });
}
export type MediaPrepareArchiveItem = RequestedResource<typeof fetchMediaListPrepareArchive>["list"][number];
export async function fetchPartialMediaPrepareArchive(body: { media_id: string }) {
  const { media_id } = body;
  const r = await client.post<MediaPrepareArchiveItemResp>("/api/v2/admin/media/archive/partial", {
    media_id,
  });
  if (r.error) {
    return Result.Err(r.error.message);
  }
  return Result.Ok(processMediaPrepareArchive(r.data));
}
/** 删除电视剧/电影 */
export function deleteMedia(body: { media_id: string }) {
  const { media_id } = body;
  return client.post("/api/v2/admin/media/delete", {
    media_id,
  });
}

/** 改变电视剧详情 */
export function setMediaProfile(body: {
  media_id: string;
  media_profile: { id: string; type: MediaTypes; name: string };
}) {
  const { media_id, media_profile } = body;
  return client.post<void>(`/api/v2/admin/media/set_profile`, {
    media_id,
    media_profile,
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

export async function fetchInvalidMediaList(body: FetchParams) {
  const r = await client.post<
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
  if (r.error) {
    return Result.Err(r.error.message);
  }
  const { next_marker, total, list } = r.data;
  return Result.Ok({
    total,
    next_marker,
    list: list.map((tip) => {
      const { id, type, media, tips } = tip;
      return {
        id,
        type,
        media,
        tips,
      };
    }),
  });
}
export type MediaErrorItem = RequestedResource<typeof fetchInvalidMediaList>["list"][number];

/**
 * 转存指定季到指定云盘
 */
export function transferMediaToAnotherDrive(body: { media_id: string; to_drive_id: string }) {
  const { media_id, to_drive_id } = body;
  return client.post<{ job_id: string }>("/api/v2/admin/media/transfer", {
    media_id,
    to_drive_id,
  });
}

/**
 * 转存指定季到对应资源盘
 */
export function transferMediaToResourceDrive(body: { media_id: string }) {
  const { media_id } = body;
  return client.post<{ job_id: string }>("/api/v2/admin/media/to_resource_drive", {
    media_id,
  });
}
