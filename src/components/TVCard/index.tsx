/**
 * @file 电视剧信息卡片
 */
import { createSignal } from "solid-js";

import { TVProfileCore } from "@/domains/tv/profile";
import { LazyImage } from "@/components/LazyImage";

export const TVCard = (props: { store: TVProfileCore }) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const poster_path = () => state().poster;
  const name = () => state().name;
  const overview = () => state().overview;
  const first_air_date = () => state().firstAirDate;

  return (
    <div
      class="flex"
      onClick={() => {
        store.click();
      }}
    >
      <LazyImage
        class="w-[180px] mr-4 object-fit"
        src={poster_path()}
        alt={name()}
      />
      <div class="flex-1">
        <div class="text-2xl">{name()}</div>
        <div class="mt-4">{overview()}</div>
        <div class="mt-4">{first_air_date()}</div>
      </div>
    </div>
  );
};
