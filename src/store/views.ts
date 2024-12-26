import { JSXElement } from "solid-js";

import { HomeLayout } from "@/pages/home/layout";
import { HomeIndexPage } from "@/pages/home";
import { HomeSeasonListPage } from "@/pages/season";
import { HomeSeasonProfilePage } from "@/pages/season/profile";
import { UnknownMediaLayout } from "@/pages/unknown_media/layout";
import { UnknownMovieListPage } from "@/pages/unknown_media/movie";
import { UnknownSeasonListPage } from "@/pages/unknown_media/season";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { NotFoundPage } from "@/pages/notfound";
import { LogListPage } from "@/pages/job";
import { LogProfilePage } from "@/pages/job/profile";
import { DriveListPage } from "@/pages/drive";
import { PersonListPage } from "@/pages/person";
import { DriveProfilePage } from "@/pages/drive/profile";
import { SharedFilesTransferPage } from "@/pages/resource";
import { MovieListPage } from "@/pages/movie";
import { MovieProfilePage } from "@/pages/movie/profile";
import { MediaPlayingPage } from "@/pages/play/index";
import { UnknownEpisodeListPage } from "@/pages/unknown_media/episode";
import { SyncTaskListPage } from "@/pages/sync_task";
import { CollectionCreatePage } from "@/pages/collection/create";
import { HomeMemberListPage } from "@/pages/member";
import { VideoParsingPage } from "@/pages/parse";
import { HomeReportListPage } from "@/pages/report";
import { PermissionManagePage } from "@/pages/permission";
import { HomeSubtitleUploadPage } from "@/pages/subtitle/add";
import { HomeSubtitleListPage } from "@/pages/subtitle";
import { SharedFilesHistoryPage } from "@/pages/resource/list";
import { SharedFilesTransferListPage } from "@/pages/resource/transfer";
import { SeasonArchivePage } from "@/pages/archive/season";
import { CollectionListPage } from "@/pages/collection";
import { CollectionEditPage } from "@/pages/collection/edit";
import { InvalidMediaListPage } from "@/pages/invalid_media";

import { ViewComponent } from "@/store/types";

import { PageKeys } from "./routes";
import { TestPage } from "@/pages/test";

export const pages: Omit<Record<PageKeys, ViewComponent>, "root"> = {
  "root.home_layout": HomeLayout,
  "root.home_layout.index": HomeIndexPage,
  "root.home_layout.drive_list": DriveListPage,
  "root.home_layout.drive_profile": DriveProfilePage,
  "root.home_layout.season_list": HomeSeasonListPage,
  "root.home_layout.season_profile": HomeSeasonProfilePage,
  "root.home_layout.movie_list": MovieListPage,
  "root.home_layout.movie_profile": MovieProfilePage,
  "root.home_layout.invalid_media_list": InvalidMediaListPage,
  "root.home_layout.permission": PermissionManagePage,
  "root.home_layout.person_list": PersonListPage,
  "root.home_layout.parse_result_layout": UnknownMediaLayout,
  "root.home_layout.parse_result_layout.movie": UnknownMovieListPage,
  "root.home_layout.parse_result_layout.season": UnknownSeasonListPage,
  "root.home_layout.parse_result_layout.episode": UnknownEpisodeListPage,
  "root.home_layout.member_list": HomeMemberListPage,
  "root.home_layout.resource_sync": SyncTaskListPage,
  "root.home_layout.job_list": LogListPage,
  "root.home_layout.job_profile": LogProfilePage,
  "root.home_layout.transfer": SharedFilesTransferPage,
  "root.home_layout.transfer_history_list": SharedFilesTransferListPage,
  "root.home_layout.transfer_search_list": SharedFilesHistoryPage,
  "root.home_layout.report_list": HomeReportListPage,
  "root.home_layout.collection_list": CollectionListPage,
  "root.home_layout.collection_create": CollectionCreatePage,
  "root.home_layout.collection_edit": CollectionEditPage,
  "root.home_layout.subtitles_list": HomeSubtitleListPage,
  "root.home_layout.subtitles_create": HomeSubtitleUploadPage,
  "root.home_layout.test": TestPage,
  "root.archive": SeasonArchivePage,
  "root.preview": MediaPlayingPage,
  "root.login": LoginPage,
  "root.register": RegisterPage,
  "root.notfound": NotFoundPage,
};
