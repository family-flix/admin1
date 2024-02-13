import { client } from "@/store/request";
import { FetchParams } from "@/domains/list/typing";
import { ListResponse, ListResponseWithCursor, RequestedResource, Result } from "@/types";
import { MediaTypes } from "@/constants";

// export async function fetchMediaProfileList(params: FetchParams & Partial<{ keyword: string; type: MediaTypes }>) {
//   const { keyword, page, pageSize, type, ...rest } = params;
//   const r = await request.post<
//     ListResponseWithCursor<{
//       id: string;
//       type: MediaTypes;
//       name: string;
//       original_name: string;
//       overview: string;
//       poster_path: string;
//       air_date: string;
//       sources: {
//         id: string;
//         name: string;
//         overview: string;
//         order: number;
//         air_date: string;
//       }[];
//     }>
//   >(`/api/v2/media_profile/list`, {
//     ...rest,
//     keyword,
//     page,
//     page_size: pageSize,
//     type,
//   });
//   if (r.error) {
//     return Result.Err(r.error.message);
//   }
//   const { next_marker, list } = r.data;
//   return Result.Ok({
//     list: list.map((media) => {
//       if (media.type === MediaTypes.Movie) {
//         const { id, name, original_name, overview, air_date, poster_path } = media;
//         return {
//           id,
//           type: MediaTypes.Movie,
//           name,
//           original_name,
//           overview,
//           poster_path,
//           air_date,
//           episodes: [],
//         };
//       }
//       const { id, name, original_name, overview, air_date, poster_path, sources = [] } = media;
//       return {
//         id,
//         type: MediaTypes.Season,
//         name,
//         original_name,
//         overview,
//         poster_path,
//         air_date,
//         episodes: sources.map((episode) => {
//           const { id, name, air_date, order } = episode;
//           return {
//             id,
//             name,
//             air_date,
//             order,
//           };
//         }),
//       };
//     }),
//     next_marker,
//   });
// }

/**
 * 搜索影视剧详情
 * @param params
 * @returns
 */
export async function fetchMediaProfileList(
  params: Partial<FetchParams> & Partial<{ keyword: string; type: MediaTypes; series_id: string }>
) {
  const { keyword, page, pageSize, type, ...rest } = params;
  const r = await client.post<
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
  >(`/api/v2/media_profile/list`, {
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
export type MediaProfileItem = RequestedResource<typeof fetchMediaProfileList>["list"][0];

export async function fetchPartialMediaProfile(body: { id: string }) {
  const { id } = body;
  const r = await client.post<{
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

export function deleteMediaProfile(body: { id: string }) {
  return client.post<ListResponse<void>>(`/api/v2/media_profile/delete`, {
    media_profile_id: body.id,
  });
}

export function editMediaProfile(body: { id: string; name?: string; source_count?: number }) {
  const { id, name, source_count } = body;
  return client.post<ListResponse<void>>(`/api/v2/media_profile/edit`, {
    id,
    name,
    source_count,
  });
}

export async function prepareSeasonList(params: { series_id: string }) {
  const { series_id } = params;
  const r = await client.post<
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
  >(`/api/v2/media_profile/init_series`, {
    series_id,
  });
  if (r.error) {
    return Result.Err(r.error);
  }
  const { list, next_marker } = r.data;
  return Result.Ok({
    list: list.map((item) => {
      return {
        ...item,
        episodes: [],
      };
    }),
    next_marker,
  });
}

export async function prepareEpisodeList(params: { media_id: string | number }) {
  const { media_id } = params;
  return client.post<
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
  >(`/api/v2/media_profile/init_season`, {
    media_id,
  });
}

/**
 * 在 TMDB 搜索影视剧
 * @param params
 * @returns
 */
export async function searchMediaInTMDB(params: Partial<FetchParams> & { keyword: string; type?: MediaTypes }) {
  const { keyword, page, pageSize, type, ...rest } = params;
  return client.post<
    ListResponse<{
      id: string | number;
      type: MediaTypes;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      air_date: string;
    }>
  >(`/api/v2/media_profile/search_tmdb`, {
    ...rest,
    keyword,
    page,
    page_size: pageSize,
    type,
  });
}
export type TheMediaInTMDB = RequestedResource<typeof searchMediaInTMDB>["list"][0];

/** 刷新电视剧详情 */
export function refreshMediaProfile(body: { media_id: string }) {
  const { media_id } = body;
  return client.post<{ job_id: string }>("/api/v2/media_profile/refresh", { media_id });
}
