import { media_request } from "@/biz/requests/index";
import { TmpRequestResp } from "@/domains/request/utils";
import { FetchParams } from "@/domains/list/typing";
import { Result } from "@/domains/result/index";
import { ListResponseWithCursor, Unpacked } from "@/types/index";
import { CollectionTypes } from "@/constants/index";

export function fetchCollectionList(params: FetchParams) {
  return media_request.post<
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
export type CollectionItem = NonNullable<Unpacked<TmpRequestResp<typeof fetchCollectionList>>>["list"][number];

export function createCollection(values: {
  title: string;
  sort: number;
  type: CollectionTypes;
  desc?: string;
  medias: { id: string }[];
}) {
  const { title, sort, desc, type = CollectionTypes.Manually, medias } = values;
  return media_request.post("/api/v2/admin/collection/create", {
    title,
    desc,
    sort,
    type,
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
  return media_request.post<{
    id: string;
    title: string;
    desc?: string;
    sort?: number;
    type?: CollectionTypes;
    medias: {
      id: string;
      type: number;
      name: string;
      poster_path: string;
      order: number;
    }[];
  }>("/api/v2/admin/collection/profile", {
    id: collection_id,
  });
}
export function fetchCollectionProfileProcess(r: TmpRequestResp<typeof fetchCollectionProfile>) {
  if (r.error) {
    return Result.Err(r.error.message);
  }
  const { id, title, desc, sort, type, medias } = r.data;
  return Result.Ok({
    id,
    title,
    desc,
    sort,
    type,
    medias: medias.sort((a, b) => a.order - b.order),
  });
}
export function editCollection(body: {
  collection_id: string;
  title: string;
  desc?: string;
  sort?: number;
  type?: CollectionTypes;
  medias: { id: string; tv_id?: string }[];
}) {
  const { collection_id, title, desc, sort, type, medias } = body;
  return media_request.post("/api/v2/admin/collection/edit", {
    id: collection_id,
    title,
    desc,
    sort,
    type,
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
  return media_request.post("/api/v2/admin/collection/delete", {
    id: collection_id,
  });
}
