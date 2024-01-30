/**
 * @file 文件夹卡片 组件
 */
import { JSX } from "solid-js/jsx-runtime";

import { LazyImage, Skeleton } from "@/components/ui";
import { ImageCore } from "@/domains/ui";

export const FolderCard = (
  props: {
    type: string;
    name: string;
    thumbnail?: string;
  } & JSX.HTMLAttributes<HTMLDivElement>
) => {
  const { type, name, thumbnail } = props;

  const img = new ImageCore({
    src: (() => {
      if (type === "folder") {
        return "https://img.alicdn.com/imgextra/i1/O1CN01rGJZac1Zn37NL70IT_!!6000000003238-2-tps-230-180.png";
      }
      if (thumbnail) {
        return thumbnail;
      }
      return "https://img.alicdn.com/imgextra/i2/O1CN01ROG7du1aV18hZukHC_!!6000000003334-2-tps-140-140.png";
    })(),
  });

  return (
    <div class="flex flex-col items-center">
      <div class="flex items-center">
        <LazyImage class="h-[80px] object-contain" store={img} />
      </div>
      <div title={name} class="mt-2 text-center break-all whitespace-pre-wrap truncate line-clamp-2">
        {name}
      </div>
    </div>
  );
};

export const FolderCardSkeleton = () => {
  return (
    <div class="flex flex-col items-center">
      <div class="flex items-center w-[80px] h-[80px]">
        <Skeleton class="max-w-full max-h-full object-contain" />
      </div>
      <Skeleton class="mt-2 h-[24px] text-center break-all whitespace-pre-wrap truncate line-clamp-2"></Skeleton>
    </div>
  );
};
