import { expect, it, describe } from "vitest";

import { FormCore, InputCore, SelectCore } from "@/domains/ui";
import { DatePickerCore } from "@/domains/ui/date-picker";
import { FormFieldCore } from "@/domains/ui/form/field";
import { ListContainerCore } from "@/domains/ui/form/list";
import { MediaTypes } from "@/constants";

describe("路径生成", () => {
  it("没有路径参数", () => {
    const $media = FormCore({
      fields: {
        type: new FormFieldCore({
          label: "类型",
          name: "type",
          tip: "有多集需要选择 电视剧 选项",
          input: new SelectCore({
            defaultValue: MediaTypes.Movie,
            options: [
              {
                label: "电影",
                value: MediaTypes.Movie,
              },
              {
                label: "电视剧",
                value: MediaTypes.Season,
              },
            ],
          }),
        }),
        title: new FormFieldCore({
          label: "标题",
          name: "title",
          input: new InputCore({
            defaultValue: "",
          }),
        }),
        air_date: new FormFieldCore({
          label: "发布时间",
          name: "air_date",
          input: DatePickerCore({
            today: new Date(),
          }),
        }),
        overview: new FormFieldCore({
          label: "描述",
          name: "overview",
          input: new InputCore({
            defaultValue: "",
          }),
        }),
        num: new FormFieldCore({
          label: "序号",
          name: "num",
          input: new InputCore({
            defaultValue: 1,
          }),
        }),
        episodes: new FormFieldCore({
          label: "剧集",
          name: "episodes",
          input: ListContainerCore({
            defaultValue: [
              {
                name: "第一集",
                overview: "",
              },
            ],
            input: () =>
              FormCore({
                fields: {
                  name: new FormFieldCore({
                    label: "名称",
                    name: "name",
                    input: new InputCore({ defaultValue: "" }),
                  }),
                  overview: new FormFieldCore({
                    label: "简介",
                    name: "overview",
                    input: new InputCore({ defaultValue: "" }),
                  }),
                },
              }),
          }),
        }),
      },
    });

    $media.fields.title.$input.setValue("测试新增媒体详情信息");
    $media.fields.air_date.$input.setValue(new Date("2024/12/10"));
    const created = $media.fields.episodes.$input.append();
    created.$input.fields.name.$input.setValue("第二集");
    created.$input.fields.overview.$input.setValue("第二集的简介");
    const result = $media.value;
    expect(result).toStrictEqual({
      type: MediaTypes.Movie,
      title: "测试新增媒体详情信息",
      air_date: new Date("2024/12/10"),
      overview: "",
      num: 1,
      episodes: [
        {
          name: "第一集",
          overview: "",
        },
        {
          name: "第二集",
          overview: "第二集的简介",
        },
      ],
    });
  });
});
