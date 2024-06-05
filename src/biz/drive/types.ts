import { FileType } from "@/constants";

export type AliyunDriveFile = {
  type: FileType;
  file_id: string;
  name: string;
  size: number;
  parent_paths: AliyunFilePath[];
  children?: AliyunDriveFile[];
};
export type AliyunFilePath = {
  file_id: string;
  name: string;
};
