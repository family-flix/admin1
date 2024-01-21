import * as Form from "@/components/ui/form";
import { Button, Input, Label } from "@/components/ui";
import { ButtonCore, InputCore } from "@/domains/ui";

export class MediaProfileValuesCore {
  $name = new InputCore({
    defaultValue: "",
  });
  $episodeCount = new InputCore({
    defaultValue: 0,
  });
  $submit = new ButtonCore({
    onClick: () => {
      const name = this.$name.value;
      const episodeCount = this.$episodeCount.value;
      const values = {
        name,
        episodeCount,
      };
      console.log(values);
    },
  });
  $reset = new ButtonCore({
    onClick: () => {
      // ...
    },
  });

  validate() {
    const name = this.$name.value;
    const episodeCount = this.$episodeCount.value;
    const values = {
      name,
      episodeCount,
    };
    return values;
  }
}

export const MediaProfileValues = (props: { store: MediaProfileValuesCore }) => {
  const { store } = props;

  return (
    <div>
      <div class="space-y-4">
        <div class="field flex items-center space-x-4">
          <Label class="w-[68px] text-left">名称</Label>
          <div class="flex-1">
            <Input store={store.$name} />
          </div>
        </div>
        <div class="field flex items-center space-x-4">
          <Label class="w-[68px] text-left">集数</Label>
          <div class="flex-1">
            <Input store={store.$episodeCount} />
          </div>
        </div>
      </div>
    </div>
  );
};
