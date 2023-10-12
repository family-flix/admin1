/**
 * @file 外部代码执行
 */
import { For, createSignal } from "solid-js";

import { Button, Textarea } from "@/components/ui";
import { RequestCore } from "@/domains/request";
import { ButtonCore, InputCore } from "@/domains/ui";
import { ViewComponent } from "@/types";
import { request } from "@/utils/request";

function execPrismaCode(code: string) {
  return request.post<unknown[][]>("/api/admin/prisma_exec", { code });
}

export const PrismaExecPage: ViewComponent = (props) => {
  const { app } = props;

  const execCodeRequest = new RequestCore(execPrismaCode, {
    onLoading(loading) {
      btn.setLoading(loading);
    },
    onSuccess(v) {
      setResult(v);
    },
    onFailed(error) {
      app.tip({
        text: ["执行失败", error.message],
      });
    },
  });
  const codeInput = new InputCore({
    defaultValue: "",
  });
  const btn = new ButtonCore({
    onClick() {
      const code = codeInput.value;
      if (!code) {
        return;
      }
      execCodeRequest.run(code);
    },
  });

  const [result, setResult] = createSignal<unknown[][]>([]);

  return (
    <div>
      <div class="p-4 space-y-2">
        <Textarea class="h-[320px]" store={codeInput} />
        <div>
          <Button class="w-full" store={btn}>
            执行
          </Button>
        </div>
      </div>
      <div class="mt-4">
        <For each={result()}>
          {(line) => {
            return line.map((v) => {
              return (
                <div>
                  {(() => {
                    if (typeof v === "string") {
                      return <div>{v}</div>;
                    }
                    if (typeof v === "number") {
                      return <div>{v}</div>;
                    }
                    if (typeof v === "object") {
                      return <pre>{JSON.stringify(v, null, 2)}</pre>;
                    }
                  })()}
                </div>
              );
            });
          }}
        </For>
      </div>
    </div>
  );
};
