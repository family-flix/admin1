import { media_request } from "@/biz/requests/index";
import { FetchParams } from "@/domains/list/typing";
import { TmpRequestResp } from "@/domains/request/utils";
import { Result } from "@/domains/result/index";
import { ListResponse, RequestedResource } from "@/types/index";
import { bytes_to_size } from "@/utils/index";

export function searchTorrentInMTeam(values: FetchParams & { keyword: string }) {
  return media_request.post<
    ListResponse<{
      id: string;
      createdDate: string;
      lastModifiedDate: string;
      name: string;
      smallDescr: string;
      imdb: string;
      imdbRating: string;
      douban: string;
      doubanRating: string;
      dmmCode: null;
      author: null;
      category: string;
      source: string;
      medium: string;
      standard: string;
      videoCodec: string;
      audioCodec: string;
      team: string;
      processing: string;
      numfiles: string;
      size: string;
      tags: string;
      labels: string;
      msUp: number;
      anonymous: boolean;
      infoHash: null;
      status: {
        id: string;
        createdDate: string;
        lastModifiedDate: string;
        pickType: string;
        toppingLevel: number;
        toppingEndTime: string;
        discount: string;
        discountEndTime: string;
        timesCompleted: string;
        comments: string;
        lastAction: string;
        views: string;
        hits: string;
        support: number;
        oppose: number;
        status: string;
        seeders: string;
        leechers: string;
        banned: boolean;
        visible: boolean;
      };
      editedBy: null;
      editDate: null;
      collection: boolean;
      inRss: boolean;
      canVote: boolean;
      imageList: string[];
      resetBox: null;
    }>
  >("/api/mteam/search", values);
}

export function searchTorrentInMTeamProcess(r: TmpRequestResp<typeof searchTorrentInMTeam>) {
  if (r.error) {
    return Result.Err(r.error.message);
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((item) => {
      const { id, smallDescr, name, size, processing, createdDate, status } = item;
      return {
        id,
        title: smallDescr,
        text: name,
        size: bytes_to_size(Number(size)),
        processing: Number(processing),
        discount_status: status.discount,
        created_at: createdDate,
      };
    }),
  });
}

export type MTeamMediaItem = RequestedResource<typeof searchTorrentInMTeamProcess>["list"][number];

export function downloadMTeamMedia(values: { id: string }) {
  return media_request.post<void>("/api/mteam/download", values);
}
