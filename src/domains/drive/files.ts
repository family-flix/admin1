import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/client";
import { FileType } from "@/constants";
import { ScrollViewCore } from "@/domains/ui";
import { Result } from "@/types";

import { fetchDriveFiles, AliyunDriveFile } from "./services";
import { AliyunFilePath } from "./types";

type FileColumn = {
  list: ListCore<typeof fetchDriveFiles, AliyunDriveFile>;
  view: ScrollViewCore;
};
enum Events {
  FoldersChange,
  PathsChange,
  SelectFolder,
}
type TheTypesOfEvents = {
  [Events.FoldersChange]: FileColumn[];
  [Events.PathsChange]: { file_id: string; name: string }[];
  [Events.SelectFolder]: [AliyunDriveFile, [number, number]];
};
type AliyunDriveFilesProps = {
  id: string;
};

export class AliyunDriveFilesCore extends BaseDomain<TheTypesOfEvents> {
  id: string;
  loading = false;
  selectedFolder: AliyunDriveFile = {
    type: FileType.Folder,
    file_id: "root",
    name: "文件",
    parent_paths: [],
  };
  paths: AliyunFilePath[] = [
    {
      file_id: "root",
      name: "文件",
    },
  ];

  /** 文件夹列表 */
  folderColumns: FileColumn[] = [];
  constructor(props: AliyunDriveFilesProps) {
    super();

    const { id } = props;

    this.id = id;
    this.folderColumns = [];
  }
  createColumn(folder: { file_id: string; name: string }) {
    const { file_id } = folder;
    const list = new ListCore<typeof fetchDriveFiles, AliyunDriveFile>(new RequestCore(fetchDriveFiles), {
      search: {
        drive_id: this.id,
        file_id,
      },
      processor(response, originalResponse) {
        list.setParams((prev) => {
          return {
            ...prev,
            // @ts-ignore
            next_marker: originalResponse.next_marker,
          };
        });
        return response;
      },
    });
    const scrollView = new ScrollViewCore({
      onReachBottom() {
        list.loadMore();
      },
    });
    list.onTip(this.tip);
    list.init();
    return {
      list,
      view: scrollView,
    };
  }
  appendColumn(folder: { file_id: string; name: string }) {
    this.folderColumns.push(this.createColumn(folder));
    this.emit(Events.FoldersChange, [...this.folderColumns]);
  }
  replaceColumn(folder: { file_id: string; name: string }, index: number) {
    this.folderColumns = [...this.folderColumns.slice(0, index + 1), this.createColumn(folder)];
    this.emit(Events.FoldersChange, [...this.folderColumns]);
  }
  clearFolderColumns() {
    this.folderColumns = [];
    this.emit(Events.FoldersChange, [...this.folderColumns]);
  }
  /** 选中文件/文件夹 */
  select(folder: AliyunDriveFile, index: [number, number]) {
    if (folder.type === FileType.File) {
      return;
    }
    this.emit(Events.SelectFolder, [folder, index]);
    //     this.curFolder = folder;
    //     this.selectedFolderPos = index;
    const [x, y] = index;
    const column = this.folderColumns[x];
    const selectedFolder = column.list.response.dataSource[y];
    (() => {
      if (x < this.folderColumns.length - 1) {
        this.replaceColumn(folder, x);
        return;
      }
      this.appendColumn(selectedFolder);
    })();
    this.paths = (() => {
      if (this.paths[x + 1]) {
        const clone = this.paths.slice(0, x + 2);
        clone[x + 1] = folder;
        return clone;
      }
      return this.paths.concat(selectedFolder);
    })();
    this.emit(Events.PathsChange, [...this.paths]);
  }

  onFolderColumnChange(handler: Handler<TheTypesOfEvents[Events.FoldersChange]>) {
    return this.on(Events.FoldersChange, handler);
  }
  onPathsChange(handler: Handler<TheTypesOfEvents[Events.PathsChange]>) {
    return this.on(Events.PathsChange, handler);
  }
}
