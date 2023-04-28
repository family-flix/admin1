import { cn } from "@/lib/utils";

export const FilmIcon = (props) => {
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
        class={cn("lucide lucide-film", props.class)}
      >
        <rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18"></rect>
        <line x1="7" x2="7" y1="2" y2="22"></line>
        <line x1="17" x2="17" y1="2" y2="22"></line>
        <line x1="2" x2="22" y1="12" y2="12"></line>
        <line x1="2" x2="7" y1="7" y2="7"></line>
        <line x1="2" x2="7" y1="17" y2="17"></line>
        <line x1="17" x2="22" y1="17" y2="17"></line>
        <line x1="17" x2="22" y1="7" y2="7"></line>
      </svg>
    </div>
  );
};
