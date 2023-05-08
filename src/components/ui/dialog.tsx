/**
 * @file 纯粹的弹窗组件
 */
import { children, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import { JSX } from "solid-js";

import { Presence } from "@/components/ui/presence";
import { DialogCore } from "@/domains/ui/dialog";
import { cn } from "@/lib/utils";

export const Dialog = (props: { core: DialogCore; children: JSX.Element }) => {
  // const c = children(() => props.children);
  return <div>{props.children}</div>;
};

export const DialogPortal = (props: {
  store: DialogCore;
  children: JSX.Element;
}) => {
  const { store } = props;
  const c = children(() => props.children);

  return (
    <Portal>
      <Presence store={store.present}>
        <DialogOverlay store={store} />
        <div class="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
          {c()}
        </div>
      </Presence>
    </Portal>
  );
};

// const DialogTrigger = DialogPrimitive.Trigger;
// const DialogPortal = ({
//   className,
//   children,
//   ...props
// }: DialogPrimitive.DialogPortalProps) => (
//   <DialogPrimitive.Portal className={cn(className)} {...props}>
//     <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
//       {children}
//     </div>
//   </DialogPrimitive.Portal>
// );
// DialogPortal.displayName = DialogPrimitive.Portal.displayName;

export const DialogOverlay = (props) => {
  const { store } = props;

  const [visible, setVisible] = createSignal(store.visible);

  store.onVisibleChange((nextVisible) => {
    setVisible(nextVisible);
  });
  const state = () => getState(visible());

  return (
    <div
      ref={props.ref}
      data-state={state()}
      class={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all duration-100",
        "data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out"
      )}
    />
  );
};
DialogOverlay.displayName = "DialogOverlay";

function getState(open: boolean) {
  return open ? "open" : "closed";
}

export const DialogContent = (props: {
  store: DialogCore;
  children: JSX.Element;
}) => {
  const { store } = props;
  // const c = children(() => props.children);
  const [visible, setVisible] = createSignal(store.visible);

  store.onVisibleChange((nextVisible) => {
    setVisible(nextVisible);
  });
  const state = () => getState(visible());

  return (
    <DialogPortal store={store}>
      <div
        data-state={state()}
        class={cn(
          "fixed z-50 grid w-full gap-4 rounded-b-lg bg-white p-6 sm:max-w-lg sm:rounded-lg sm:zoom-in-90",
          "dark:bg-slate-900",
          "animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-bottom-10 data-[state=open]:sm:slide-in-from-bottom-0"
        )}
      >
        {props.children}
        <div
          data-state={state()}
          class="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-slate-100 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900 dark:data-[state=open]:bg-slate-800"
        >
          <span class="sr-only">Close</span>
        </div>
      </div>
    </DialogPortal>
  );
};

// const DialogContent = React.forwardRef<
//   React.ElementRef<typeof DialogPrimitive.Content>,
//   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
// >(({ className, children, ...props }, ref) => (
//   <DialogPortal>
//     <DialogOverlay />
//     <DialogPrimitive.Content
//       ref={ref}
//       className={cn(
//         "fixed z-50 grid w-full gap-4 rounded-b-lg bg-white p-6 animate-in data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-bottom-10 sm:max-w-lg sm:rounded-lg sm:zoom-in-90 data-[state=open]:sm:slide-in-from-bottom-0",
//         "dark:bg-slate-900",
//         className
//       )}
//       {...props}
//     >
//       {children}
//       <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-slate-100 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900 dark:data-[state=open]:bg-slate-800">
//         <X className="h-4 w-4" />
//         <span className="sr-only">Close</span>
//       </DialogPrimitive.Close>
//     </DialogPrimitive.Content>
//   </DialogPortal>
// ));
// DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogHeader = (props) => {
  const { className } = props;
  const c = children(() => props.children);
  return (
    <div
      class={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    >
      {c()}
    </div>
  );
};
// const DialogHeader = ({
//   className,
//   ...props
// }: React.HTMLAttributes<HTMLDivElement>) => (
//   <div
//     className={cn(
//       "flex flex-col space-y-2 text-center sm:text-left",
//       className
//     )}
//     {...props}
//   />
// );
// DialogHeader.displayName = "DialogHeader";

export const DialogFooter = (props) => {
  const { className } = props;
  const c = children(() => props.children);
  return (
    <div
      class={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
    >
      {c()}
    </div>
  );
};

export const DialogTitle = (props) => {
  const { title, className } = props;
  return (
    <div
      class={cn(
        "text-lg font-semibold text-slate-900",
        "dark:text-slate-50",
        className
      )}
    >
      {title}
    </div>
  );
};

// const DialogDescription = React.forwardRef<
//   React.ElementRef<typeof DialogPrimitive.Description>,
//   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
// >(({ className, ...props }, ref) => (
//   <DialogPrimitive.Description
//     ref={ref}
//     className={cn("text-sm text-slate-500", "dark:text-slate-400", className)}
//     {...props}
//   />
// ));
// DialogDescription.displayName = DialogPrimitive.Description.displayName;

// export {
//   Dialog,
//   DialogTrigger,
//   DialogContent,
//   DialogHeader,
//   DialogFooter,
//   DialogTitle,
//   DialogDescription,
// };
