import {
  Root as ScrollAreaRoot,
  Scrollbar as ScrollAreaScrollbar,
  Thumb as ScrollAreaThumb,
  Viewport as ScrollAreaViewport,
} from "@radix-ui/react-scroll-area";
import { Slot } from "@radix-ui/react-slot";
import type { CSSProperties, ReactNode } from "react";
import { ArrowLeftIcon, XIcon } from "./icons";
import { useSheetPanel } from "./panel-context";

// ── Sheet.Handle ────────────────────────────────

export interface SheetHandleProps {
  /** Render as child element, merging props */
  asChild?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Custom handle content. Defaults to a centered grab bar. */
  children?: ReactNode;
}

function SheetHandle({
  asChild,
  className,
  style,
  children,
}: SheetHandleProps) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      className={`flex shrink-0 cursor-grab touch-none items-center justify-center pt-4 pb-1 ${className ?? ""}`}
      data-stacksheet-handle=""
      style={style}
    >
      {children ?? (
        <div
          className="h-1 w-9 rounded-sm"
          style={{ background: "var(--muted-foreground, rgba(0, 0, 0, 0.25))" }}
        />
      )}
    </Comp>
  );
}

// ── Sheet.Header ────────────────────────────────

export interface SheetHeaderProps {
  asChild?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

function SheetHeader({
  asChild,
  className,
  style,
  children,
}: SheetHeaderProps) {
  const Comp = asChild ? Slot : "header";
  return (
    <Comp className={`shrink-0 ${className ?? ""}`} style={style}>
      {children}
    </Comp>
  );
}

// ── Sheet.Title ─────────────────────────────────

export interface SheetTitleProps {
  asChild?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

function SheetTitle({ asChild, className, style, children }: SheetTitleProps) {
  const { panelId } = useSheetPanel();
  const Comp = asChild ? Slot : "h2";
  return (
    <Comp className={className} id={`${panelId}-title`} style={style}>
      {children}
    </Comp>
  );
}

// ── Sheet.Description ───────────────────────────

export interface SheetDescriptionProps {
  asChild?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

function SheetDescription({
  asChild,
  className,
  style,
  children,
}: SheetDescriptionProps) {
  const { panelId } = useSheetPanel();
  const Comp = asChild ? Slot : "p";
  return (
    <Comp className={className} id={`${panelId}-desc`} style={style}>
      {children}
    </Comp>
  );
}

// ── Sheet.Body ──────────────────────────────────

export interface SheetBodyProps {
  /** When true, renders child element directly instead of ScrollArea */
  asChild?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

function SheetBody({ asChild, className, style, children }: SheetBodyProps) {
  if (asChild) {
    return (
      <Slot
        className={`relative min-h-0 flex-1 ${className ?? ""}`}
        data-stacksheet-no-drag=""
        style={style}
      >
        {children}
      </Slot>
    );
  }

  return (
    <ScrollAreaRoot
      className={`relative min-h-0 flex-1 overflow-hidden ${className ?? ""}`}
      data-stacksheet-no-drag=""
      style={style}
    >
      <ScrollAreaViewport className="h-full w-full overscroll-contain">
        {children}
      </ScrollAreaViewport>
      <ScrollAreaScrollbar
        className="flex w-2 touch-none select-none p-0.5"
        orientation="vertical"
      >
        <ScrollAreaThumb
          className="relative flex-1 rounded"
          style={{ background: "var(--border, rgba(0, 0, 0, 0.15))" }}
        />
      </ScrollAreaScrollbar>
    </ScrollAreaRoot>
  );
}

// ── Sheet.Footer ────────────────────────────────

export interface SheetFooterProps {
  asChild?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

function SheetFooter({
  asChild,
  className,
  style,
  children,
}: SheetFooterProps) {
  const Comp = asChild ? Slot : "footer";
  return (
    <Comp className={`shrink-0 ${className ?? ""}`} style={style}>
      {children}
    </Comp>
  );
}

// ── Sheet.Close ─────────────────────────────────

export interface SheetCloseProps {
  asChild?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Custom content. Defaults to an X icon. */
  children?: ReactNode;
}

function SheetClose({ asChild, className, style, children }: SheetCloseProps) {
  const { close } = useSheetPanel();
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      aria-label={children ? undefined : "Close"}
      className={className}
      onClick={close}
      style={style}
      type={asChild ? undefined : "button"}
    >
      {children ?? <XIcon />}
    </Comp>
  );
}

// ── Sheet.Back ──────────────────────────────────

export interface SheetBackProps {
  asChild?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Custom content. Defaults to an arrow-left icon. */
  children?: ReactNode;
}

function SheetBack({ asChild, className, style, children }: SheetBackProps) {
  const { back, isNested } = useSheetPanel();

  if (!isNested) {
    return null;
  }

  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      aria-label={children ? undefined : "Back"}
      className={className}
      onClick={back}
      style={style}
      type={asChild ? undefined : "button"}
    >
      {children ?? <ArrowLeftIcon />}
    </Comp>
  );
}

// ── Sheet namespace ─────────────────────────────

export const Sheet = {
  Handle: SheetHandle,
  Header: SheetHeader,
  Title: SheetTitle,
  Description: SheetDescription,
  Body: SheetBody,
  Footer: SheetFooter,
  Close: SheetClose,
  Back: SheetBack,
} as const;
