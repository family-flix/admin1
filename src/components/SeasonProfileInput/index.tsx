import dayjs from "dayjs";

import { InputCore } from "@/domains/ui";
import { ImageUploadCore } from "@/domains/ui/form/image-upload";
import { Input, Textarea } from "@/components//ui";
import { DatePicker } from "@/components/ui/date-picker";
import { DatePickerCore } from "@/domains/ui/date-picker";

export function SeasonProfileInputCore() {
  const $title = new InputCore({
    defaultValue: "",
  });
  const $air_date = DatePickerCore({
    today: new Date(),
  });
  const $summary = new InputCore({
    defaultValue: "",
  });
  const $poster = ImageUploadCore({});

  return {
    ui: {
      $title,
      $airDate: $air_date,
      $summary,
      $poster,
    },
    setValues(values: { title: string; air_date: string; summary: string }) {
      if (values.title) {
        $title.setValue(values.title);
      }
      if (values.air_date) {
        const d = dayjs(values.air_date);
        console.log("[DOMAIN]season-profile-input - setValues", d.format("YYYY/MM/DD"));
        $air_date.setValue(d.toDate());
      }
      if (values.summary) {
        $summary.setValue(values.summary);
      }
    },
    getValues() {
      const name = $title.value;
      const air_date = $air_date.value;
      const overview = $summary.value;
      return {
        name,
        air_date,
        overview,
      };
    },
  };
}
type SeasonProfileInputCore = ReturnType<typeof SeasonProfileInputCore>;

export function SeasonProfileInput(props: { store: SeasonProfileInputCore }) {
  const { store } = props;

  return (
    <div>
      <div class="fields space-y-4">
        <div class="field">
          <div class="field__label">
            <div>标题</div>
          </div>
          <div class="field__inner mt-2">
            <div class="field__input">
              <Input store={store.ui.$title} />
            </div>
          </div>
        </div>
        <div class="field">
          <div class="field__label">
            <div>发布日期</div>
          </div>
          <div class="field__inner mt-2">
            <div class="field__input">
              <DatePicker store={store.ui.$airDate} />
            </div>
          </div>
        </div>
        <div class="field">
          <div class="field__label">
            <div>简介</div>
          </div>
          <div class="field__inner mt-2">
            <div class="field__input">
              <Textarea store={store.ui.$summary} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
