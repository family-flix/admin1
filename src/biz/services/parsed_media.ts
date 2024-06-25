import { media_request } from "@/biz/requests/index";
import { ListResponseWithCursor } from "@/biz/requests/types";
import { EpisodeResolutionTypeTexts, EpisodeResolutionTypes } from "@/biz/tv/constants";
import { FetchParams } from "@/domains/list/typing";
import { TmpRequestResp, RequestedResource } from "@/domains/request/utils";
import { Result } from "@/domains/result/index";
import { MediaTypes } from "@/constants/index";

/**
 * 获取解析出的影视剧列表
 */
export function fetchUnknownMediaList(params: FetchParams & { name?: string; empty?: 0 | 1; type?: MediaTypes }) {
  const { page, pageSize, type, ...rest } = params;
  // console.log("[SERVICES]fetchUnknownMediaList", type);
  return media_request.post<
    ListResponseWithCursor<{
      id: string;
      name: string;
      season_text: string;
      profile: {
        id: string;
        name: string;
        poster_path: string;
      } | null;
      sources: {
        id: string;
        name: string;
        original_name: string;
        season_text: string;
        episode_text: string;
        file_name: string;
        parent_paths: string;
        profile: null | {
          id: string;
          name: string;
          poster_path: string;
          order: number;
        };
        drive: {
          id: string;
          name: string;
        };
      }[];
    }>
  >("/api/v2/admin/parsed_media/list", {
    ...rest,
    type,
    page,
    page_size: pageSize,
  });
}
export type UnknownSeasonMediaItem = RequestedResource<typeof fetchUnknownMediaListProcess>["list"][0];
export function fetchUnknownMediaListProcess(r: TmpRequestResp<typeof fetchUnknownMediaList>) {
  if (r.error) {
    return Result.Err(r.error.message);
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((tv) => {
      const { id, name, season_text, profile, sources } = tv;
      return {
        id,
        name,
        season_text,
        profile,
        sources,
      };
    }),
  });
}
/**
 * 获取解析出的电影列表
 */
export function fetchUnknownMovieMediaList(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  return media_request.post<
    ListResponseWithCursor<{
      id: string;
      name: string;
      season_text: string;
      profile: {
        id: string;
        name: string;
        poster_path: string;
      } | null;
      sources: {
        id: string;
        name: string;
        original_name: string;
        season_text: string;
        episode_text: string;
        file_name: string;
        parent_paths: string;
        profile: null | {
          id: string;
          name: string;
          poster_path: string;
        };
        drive: {
          id: string;
          name: string;
        };
      }[];
    }>
  >("/api/v2/admin/parsed_media/list", {
    ...rest,
    type: MediaTypes.Movie,
    page,
    page_size: pageSize,
  });
}
export type UnknownMovieMediaItem = RequestedResource<typeof fetchUnknownMovieMediaListProcess>["list"][0];
export function fetchUnknownMovieMediaListProcess(r: TmpRequestResp<typeof fetchUnknownMovieMediaList>) {
  if (r.error) {
    return Result.Err(r.error.message);
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((tv) => {
      const { id, name, season_text, profile, sources } = tv;
      return {
        id,
        name,
        season_text,
        profile,
        sources,
      };
    }),
  });
}
/**
 * 获取解析出的剧集列表
 */
export function fetchParsedMediaSourceList(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  return media_request.post<
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
  >("/api/v2/admin/parsed_media_source/list", {
    ...rest,
    type: MediaTypes.Season,
    page,
    page_size: pageSize,
  });
}
export type UnknownEpisodeItem = RequestedResource<typeof fetchParsedMediaSourceListProcess>["list"][0];
export function fetchParsedMediaSourceListProcess(r: TmpRequestResp<typeof fetchParsedMediaSourceList>) {
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
/**
 * 给影视剧解析结果设置一个详情
 */
export function setParsedMediaProfile(body: {
  parsed_media_id: string;
  media_profile: { id: string; type: MediaTypes; name: string };
}) {
  const { parsed_media_id, media_profile } = body;
  return media_request.post<void>("/api/v2/admin/parsed_media/set_profile", {
    parsed_media_id,
    media_profile,
  });
}
/**
 * 给视频文件设置一个详情
 */
export function setParsedMediaProfileInFileId(body: {
  file_id: string;
  media_profile: { id: string; type: MediaTypes; name: string };
}) {
  const { file_id, media_profile } = body;
  return media_request.post<void>("/api/v2/admin/parsed_media/set_profile_in_file_id", {
    file_id,
    media_profile,
  });
}

/**
 * 给剧集解析结果设置一个详情
 */
export function setParsedSeasonMediaSourceProfile(body: {
  parsed_media_source_id: string;
  media_profile: { id: string; type: MediaTypes; name: string };
  media_source_profile?: { id: string };
}) {
  const { parsed_media_source_id, media_profile, media_source_profile } = body;
  return media_request.post<void>("/api/v2/admin/parsed_media_source/set_profile", {
    parsed_media_source_id,
    media_profile,
    media_source_profile,
  });
}
/**
 * 删除解析出的影视剧记录及对应的剧集记录
 */
export function deleteParsedMedia(params: { parsed_media_id: string }) {
  const { parsed_media_id } = params;
  return media_request.post("/api/v2/admin/parsed_media/delete", {
    id: parsed_media_id,
  });
}
/**
 * 删除解析出的剧集记录（不删除文件
 */
export function deleteParsedMediaSource(params: { parsed_media_source_id: string }) {
  const { parsed_media_source_id } = params;
  return media_request.post("/api/v2/admin/parsed_media_source/delete", {
    parsed_media_source_id,
  });
}
/**
 * 获取视频文件播放信息
 */
export function fetchSourcePreviewInfo(body: { id: string }) {
  const { id } = body;
  return media_request.post<{
    id: string;
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
}
export function fetchSourcePreviewInfoProcess(r: TmpRequestResp<typeof fetchSourcePreviewInfo>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  const { id, url, width, height, type, other, thumbnail } = r.data;
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
