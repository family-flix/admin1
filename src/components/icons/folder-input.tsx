import { cn } from "@/lib/utils";

export const FolderInputIcon = (props) => {
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
        class={cn("lucide lucide-folder-input", props.class)}
      >
        <path d="M2 9V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"></path>
        <path d="M2 13h10"></path>
        <path d="m9 16 3-3-3-3"></path>
      </svg>
    </div>
  );
};
