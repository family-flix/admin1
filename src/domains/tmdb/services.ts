import { FetchParams } from "@/domains/list/typing";
import { request } from "@/utils/request";
import { ListResponse, RequestedResource } from "@/types";

/**
 * 在 TMDB 搜索影视剧
 * @param params
 * @returns
 */
export async function searchMediaInTMDB(params: FetchParams & { keyword: string; type: "tv" | "movie" }) {
  const { keyword, page, pageSize, type, ...rest } = params;
  return request.get<
    ListResponse<{
      id: number;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      searched_tv_id: string;
      first_air_date: string;
    }>
  >(`/api/admin/tmdb/search`, {
    ...rest,
    keyword,
    page,
    page_size: pageSize,
    type: type === "movie" ? "2" : "1",
  });
}
export type TheTVInTMDB = RequestedResource<typeof searchMediaInTMDB>["list"][0];

export async function fetchTVProfileInTMDB(params: { unique_id: string }) {
  const { unique_id } = params;
  return request.post<{
    adult: boolean;
    backdrop_path: string;
    created_by: {
      id: number;
      credit_id: string;
      name: string;
      gender: number;
      profile_path: null;
    }[];
    episode_run_time: number[];
    first_air_date: string;
    genres: {
      id: number;
      name: string;
    }[];
    homepage: string;
    id: number;
    in_production: boolean;
    languages: string[];
    last_air_date: string;
    last_episode_to_air: {
      id: number;
      name: string;
      overview: string;
      vote_average: number;
      vote_count: number;
      air_date: string;
      episode_number: number;
      episode_type: string;
      production_code: string;
      runtime: number;
      season_number: number;
      show_id: number;
      still_path: string;
    };
    name: string;
    next_episode_to_air: null;
    networks: {
      id: number;
      logo_path: string;
      name: string;
      origin_country: string;
    }[];
    number_of_episodes: number;
    number_of_seasons: number;
    origin_country: string[];
    original_language: string;
    original_name: string;
    overview: string;
    popularity: number;
    poster_path: string;
    production_companies: {
      id: number;
      logo_path: null;
      name: string;
      origin_country: string;
    }[];
    production_countries: {
      iso_3166_1: string;
      name: string;
    }[];
    seasons: {
      air_date: string;
      episode_count: number;
      id: number;
      name: string;
      overview: string;
      poster_path: string;
      season_number: number;
      vote_average: number;
    }[];
    spoken_languages: {
      english_name: string;
      iso_639_1: string;
      name: string;
    }[];
    status: string;
    tagline: string;
    type: string;
    vote_average: number;
    vote_count: number;
  }>(`/api/admin/tmdb/tv_profile`, {
    unique_id,
  });
}
export type TheTVProfileInTMDB = RequestedResource<typeof fetchTVProfileInTMDB>;

export async function fetchSeasonProfileInTMDB(params: { unique_id: string; season_number: number }) {
  const { unique_id, season_number } = params;
  return request.post<{
    air_date: string;
    episodes: {
      air_date: string;
      episode_number: number;
      episode_type: string;
      id: number;
      name: string;
      overview: string;
      production_code: string;
      runtime: null;
      season_number: number;
      show_id: number;
      still_path: string;
      vote_average: number;
      vote_count: number;
      crew: unknown[];
      guest_stars: unknown[];
    }[];
    name: string;
    overview: string;
    id: number;
    poster_path: string;
    season_number: number;
    vote_average: number;
  }>(`/api/admin/tmdb/season_profile`, {
    unique_id,
    season_number,
  });
}
export type TheSeasonProfileInTMDB = RequestedResource<typeof fetchSeasonProfileInTMDB>;
