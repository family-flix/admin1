import { FileType } from "@/constants";

export type DriveFile = {
  type: FileType;
  file_id: string;
  name: string;
  size: number;
  parent_paths: DriveFilePath[];
  children?: DriveFile[];
};
export type DriveFilePath = {
  file_id: string;
  name: string;
};
