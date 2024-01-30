/**
 * @file 视频文件名解析页面
 */
import { For, createSignal } from "solid-js";

import { Button, Input } from "@/components/ui";
import { FilenameParserCore } from "@/components/FilenameParser/store";
import { ViewComponent } from "@/store/types";

export const VideoParsingPage: ViewComponent = (props) => {
  const { app, view } = props;

  const filenameParser = new FilenameParserCore({});

  const [info, setInfo] = createSignal(filenameParser.state);

  filenameParser.onStateChange((nextState) => {
    setInfo(nextState);
  });

  return (
    <div class="p-8">
      <h1 class="text-2xl">文件名解析</h1>
      <div class="mt-8">
        <div class="flex items-center space-x-2">
          <Input store={filenameParser.input} />
          <Button store={filenameParser.btn} class="btn btn--primary btn--block">
            解析
          </Button>
        </div>
        <div class="mt-4">
          <For each={info().fields}>
            {(field) => {
              return (
                <div class="flex align-middle">
                  <div class="align-left min-w-[114px]">{field.label}</div>
                  <span>：</span>
                  <div class="align-left w-full break-all whitespace-pre-wrap">{field.text}</div>
                </div>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
};
