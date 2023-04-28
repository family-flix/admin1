import { cn } from "@/lib/utils";

export const MoreHorizontalIcon = (props) => {
  return (
    <div class="p-2 rounded-lg hover:opacity-80 hover:bg-slate-200 cursor-pointer">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class={cn("lucide lucide-more-horizontal", props.class)}
      >
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="19" cy="12" r="1"></circle>
        <circle cx="5" cy="12" r="1"></circle>
      </svg>
    </div>
  );
};
