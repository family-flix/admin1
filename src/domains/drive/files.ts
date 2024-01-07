/**
 * @todo 如果删除当前选中的文件夹，子文件夹在视图上也要同步移除
 */
import { fetchDriveFiles, renameFileInDrive, deleteFileInDrive } from "@/services/drive";
import { BaseDomain, Handler } from "@/domains/base";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { ScrollViewCore } from "@/domains/ui";
import { BizError } from "@/domains/error";
import { FileType } from "@/constants";

import { AliyunFilePath, AliyunDriveFile } from "./types";

type FileColumn = {
  list: ListCore<typeof fetchDriveFiles, AliyunDriveFile>;
  view: ScrollViewCore;
};
enum Events {
  Initialized,
  FoldersChange,
  PathsChange,
  SelectFolder,
  LoadingChange,
  StateChange,
  Error,
}
type TheTypesOfEvents = {
  [Events.Initialized]: void;
  [Events.FoldersChange]: FileColumn[];
  [Events.PathsChange]: { file_id: string; name: string }[];
  [Events.SelectFolder]: [AliyunDriveFile, [number, number]];
  [Events.LoadingChange]: boolean;
  [Events.StateChange]: AliyunDriveFilesState;
  [Events.Error]: BizError;
};
type AliyunDriveFilesState = {
  initialized: boolean;
  curFolder: AliyunDriveFile | null;
  tmpHoverFile: [AliyunDriveFile, [number, number]] | null;
};
type AliyunDriveFilesProps = {
  id: string;
  onError?: (err: BizError) => void;
};

export class AliyunDriveFilesCore extends BaseDomain<TheTypesOfEvents> {
  id: string;
  loading = false;
  initialized = false;
  selectedFolder: AliyunDriveFile | null = null;
  virtualSelectedFolder: [AliyunDriveFile, [number, number]] | null = null;
  tmpSelectedColumn: FileColumn | null = null;
  paths: AliyunFilePath[] = [
    {
      file_id: "root",
      name: "文件",
    },
  ];
  /** 文件夹列表 */
  folderColumns: FileColumn[] = [];
  get state() {
    return {
      initialized: this.initialized,
      curFolder: this.selectedFolder,
      tmpHoverFile: this.virtualSelectedFolder,
    };
  }

  constructor(props: AliyunDriveFilesProps) {
    super();

    const { id, onError } = props;

    this.id = id;
    this.folderColumns = [];
    if (onError) {
      this.onError(onError);
    }
  }
  createColumn(folder: { file_id: string; name: string }) {
    console.log("[DOMAIN]drive/files - createColumn", this.id);
    const drive_id = this.id;
    const { file_id } = folder;
    const list = new ListCore<typeof fetchDriveFiles, AliyunDriveFile>(new RequestCore(fetchDriveFiles), {
      pageSize: 50,
      search: {
        drive_id,
        file_id,
      },
      processor: (response, originalResponse) => {
        list.setParams((prev) => {
          return {
            ...prev,
            // @ts-ignore
            next_marker: originalResponse.next_marker,
          };
        });
        return {
          ...response,
          dataSource: response.dataSource.map((file) => {
            const parent_paths = this.paths.slice(1);
            return {
              ...file,
              parent_paths,
            };
          }),
        };
      },
    });
    list.onStateChange((response) => {
      if (response.error) {
        this.emit(Events.Error, new BizError(response.error.message));
        return;
      }
      if (response.initial === false) {
        this.initialized = true;
        this.emit(Events.StateChange, { ...this.state });
      }
      this.emit(Events.FoldersChange, [...this.folderColumns]);
    });
    list.onLoadingChange((loading) => {
      this.loading = loading;
      this.emit(Events.LoadingChange, loading);
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
    this.selectedFolder = folder;
    this.emit(Events.SelectFolder, [folder, index]);
    const [x, y] = index;
    const column = this.folderColumns[x];
    column.list.modifyItem((f) => {
      return {
        ...f,
        selected: f.file_id === folder.file_id,
        hover: false,
      };
    });
    const selectedFolder = column.list.response.dataSource[y];
    if (folder.type === FileType.File) {
      // @todo 获取文件详情
      return;
    }
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
  virtualSelect(folder: AliyunDriveFile, position: [number, number]) {
    this.virtualSelectedFolder = [folder, position];
    this.emit(Events.SelectFolder, [folder, position]);
    const [x, y] = position;
    const column = this.folderColumns[x];
    this.tmpSelectedColumn = column;
    column.list.modifyItem((f) => {
      return {
        ...f,
        hover: f.file_id === folder.file_id,
      };
    });
  }
  clear() {
    this.selectedFolder = null;
  }
  clearVirtualSelected() {
    this.virtualSelectedFolder = null;
    if (!this.tmpSelectedColumn) {
      return;
    }
    const column = this.tmpSelectedColumn;
    this.tmpSelectedColumn = null;
    column.list.modifyItem((f) => {
      return {
        ...f,
        hover: false,
      };
    });
  }
  async deleteFile(options: {
    file: {
      file_id: string;
    };
    position: [number, number];
    onLoading?: (loading: boolean) => void;
    onFailed?: (error: Error) => void;
    onSuccess?: (options: { job_id?: string; deleteFile: () => void }) => void;
  }) {
    const { file, position, onLoading, onFailed, onSuccess } = options;
    const [columnIndex, fileIndex] = position;
    const folderColumns = this.folderColumns;
    function delete_file() {
      const column = folderColumns[columnIndex];
      column.list.deleteItem((f) => {
        if (f.file_id === file.file_id) {
          return true;
        }
        return false;
      });
    }
    const folderDeletingRequest = new RequestCore(deleteFileInDrive, {
      onLoading,
      onFailed,
      onSuccess: (data) => {
        if (onSuccess) {
          onSuccess(
            data
              ? // @todo 这个实现很糟糕
                {
                  job_id: data.job_id,
                  deleteFile: delete_file,
                }
              : {
                  deleteFile: delete_file,
                }
          );
        }
      },
    });
    return folderDeletingRequest.run({
      drive_id: this.id,
      file_id: file.file_id,
    });
  }
  rename(options: {
    file: {
      file_id: string;
      name: string;
    };
    position: [number, number];
    onLoading?: (loading: boolean) => void;
    onFailed?: (error: Error) => void;
    onSuccess?: () => void;
  }) {
    const { file, position, onLoading, onFailed, onSuccess } = options;
    const [columnIndex, fileIndex] = position;
    const folderColumns = this.folderColumns;
    const folderDeletingRequest = new RequestCore(renameFileInDrive, {
      onLoading,
      onFailed,
      onSuccess: () => {
        const column = folderColumns[columnIndex];
        column.list.modifyItem((f) => {
          if (f.file_id === file.file_id) {
            return {
              ...f,
              name: file.name,
            };
          }
          return f;
        });
        if (onSuccess) {
          onSuccess();
        }
      },
    });
    return folderDeletingRequest.run({
      drive_id: this.id,
      file_id: file.file_id,
      name: file.name,
    });
  }

  onFolderColumnChange(handler: Handler<TheTypesOfEvents[Events.FoldersChange]>) {
    return this.on(Events.FoldersChange, handler);
  }
  onPathsChange(handler: Handler<TheTypesOfEvents[Events.PathsChange]>) {
    return this.on(Events.PathsChange, handler);
  }
  onSelectFolder(handler: Handler<TheTypesOfEvents[Events.SelectFolder]>) {
    return this.on(Events.SelectFolder, handler);
  }
  onLoadingChange(handler: Handler<TheTypesOfEvents[Events.LoadingChange]>) {
    return this.on(Events.LoadingChange, handler);
  }
  onError(handler: Handler<TheTypesOfEvents[Events.Error]>) {
    return this.on(Events.Error, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
