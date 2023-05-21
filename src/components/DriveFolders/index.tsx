/**
 * @file 网盘文件夹列表
 */

import FolderCard from "@/components/FolderCard";
import FolderMenu, { MenuOpt } from "@/components/FolderMenu";
import ScrollView from "@/components/ScrollView";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AliyunFolderItem, fetch_aliyun_drive_files } from "@/services";
import { Result } from "@/types";
import {
  AliyunDriveProfile,
  fetchDriveProfile,
} from "@/domains/drive/services";
import { cn } from "@/lib/utils";


const DriveFolders = (props: {
  className: string;
  id: string;
  size?: number;
  options?: MenuOpt[];
}) => {
  const { className, options = [], id, size = 20 } = props;

  return (
    <div class="">
      
    </div>
  );
};

export default DriveFolders;
