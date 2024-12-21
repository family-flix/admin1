import { ImageCore } from "@/domains/ui/image";
import { DragZoneCore } from "@/domains/ui/drag-zone";

type ImageUploadPropsCore = {};

export function ImageUploadCore(props: ImageUploadPropsCore) {
  const $image = new ImageCore({});
  const $upload = new DragZoneCore();

  return {};
}
