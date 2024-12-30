import { JSX } from "solid-js/jsx-runtime";

import { FormFieldCore } from "@/domains/ui/form/field";

export function Field(props: { store: FormFieldCore<any> } & JSX.HTMLAttributes<HTMLDivElement>) {
  const { store } = props;

  return (
    <div class="field">
      <div class="field__main">
        <div class="field__label">
          <div class="field__title">{store.label}</div>
        </div>
        <div class="field__content">
          <div class="field__value">{props.children}</div>
          {/* <div class="field__extra">
            <div class="field__line--vertical"></div>
            <div class="field__text-btn"></div>
            <div class="field__icon w-4 h-4"></div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
