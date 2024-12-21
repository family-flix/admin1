import { base, Handler } from "@/domains/base";
import { CalendarCore } from "@/domains/ui/calendar";
import { PopoverCore } from "@/domains/ui/popover";
import { ButtonCore } from "@/domains/ui/button";
import dayjs from "dayjs";

export function DatePickerCore(props: { today: Date }) {
  const { today } = props;

  const $popover = new PopoverCore({
    strategy: "fixed",
  });
  const $calendar = CalendarCore({
    today,
  });
  const $btn = new ButtonCore({});
  $calendar.onChange(() => {
    bus.emit(Events.Change, { ..._state });
  });

  const _state = {
    get date() {
      if ($calendar.value) {
        return dayjs($calendar.value).format("YYYY/MM/DD");
      }
      return "请选择";
    },
  };
  enum Events {
    Change,
  }
  type TheTypesOfEvents = {
    [Events.Change]: typeof _state;
  };
  const bus = base<TheTypesOfEvents>();

  return {
    state: _state,
    get value() {
      return $calendar.value;
    },
    $popover,
    $calendar,
    $btn,
    setValue(v: Date) {
      console.log("[DOMAIN]ui/date-picker - setValue");
      $calendar.selectDay(v);
    },
    onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
      return bus.on(Events.Change, handler);
    },
  };
}

export type DatePickerCore = ReturnType<typeof DatePickerCore>;
