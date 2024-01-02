import { FetchParams } from "@/domains/list/typing";
import { ListResponseWithCursor, RequestedResource } from "@/types";
import { request } from "@/utils/request";

export function fetchCollectionList(params: FetchParams) {
  return request.post<
    ListResponseWithCursor<{
      id: string;
      title: string;
      desc?: string;
      medias: {
        id: string;
        type: number;
        name: string;
        poster_path: string;
        order: number;
      }[];
    }>
  >("/api/v2/admin/collection/list", params);
}
export type CollectionItem = RequestedResource<typeof fetchCollectionList>["list"][number];

export function createCollection(values: { title: string; sort: number; desc?: string; medias: { id: string }[] }) {
  const { title, sort, desc, medias } = values;
  return request.post("/api/v2/admin/collection/create", {
    title,
    desc,
    sort,
    orders: medias
      .map((media, index) => {
        return {
          [media.id]: index,
        };
      })
      .reduce((result, cur) => {
        return {
          ...result,
          ...cur,
        };
      }, {}),
    medias,
  });
}
export function fetchCollectionProfile(values: { collection_id: string }) {
  const { collection_id } = values;
  return request.post<{
    id: string;
    title: string;
    desc?: string;
    sort?: number;
    medias: {
      id: string;
      type: number;
      name: string;
      poster_path: string;
    }[];
  }>("/api/v2/admin/collection/profile", {
    collection_id,
  });
}
export function editCollection(body: {
  collection_id: string;
  title: string;
  desc?: string;
  sort?: number;
  medias: { id: string; tv_id?: string }[];
}) {
  const { collection_id, title, desc, sort, medias } = body;
  return request.post("/api/admin/collection/edit", {
    collection_id,
    title,
    desc,
    sort,
    orders: medias
      .map((media, index) => {
        return {
          [media.id]: index,
        };
      })
      .reduce((result, cur) => {
        return {
          ...result,
          ...cur,
        };
      }, {}),
    medias,
  });
}

export function deleteCollection(body: { collection_id: string }) {
  const { collection_id } = body;
  return request.post("/api/admin/collection/delete", {
    collection_id,
  });
}
