import { cn } from "@/lib/utils";

export const CalendarIcon = (props) => {
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
        class={cn("lucide lucide-calendar", props.class)}
      >
        <path d="M21 14V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"></path>
        <line x1="16" x2="16" y1="2" y2="6"></line>
        <line x1="8" x2="8" y1="2" y2="6"></line>
        <line x1="3" x2="21" y1="10" y2="10"></line>
        <path d="m16 20 2 2 4-4"></path>
      </svg>
    </div>
  );
};
