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

const HANDLE_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 0 4px",
  flexShrink: 0,
  cursor: "grab",
  touchAction: "none",
};

const HANDLE_BAR_STYLE: CSSProperties = {
  width: 36,
  height: 4,
  borderRadius: 2,
  background: "var(--muted-foreground, rgba(0, 0, 0, 0.25))",
};

function SheetHandle({
  asChild,
  className,
  style,
  children,
}: SheetHandleProps) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      className={className}
      data-stacksheet-handle=""
      style={{ ...HANDLE_STYLE, ...style }}
    >
      {children ?? <div style={HANDLE_BAR_STYLE} />}
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

const HEADER_STYLE: CSSProperties = {
  flexShrink: 0,
};

function SheetHeader({
  asChild,
  className,
  style,
  children,
}: SheetHeaderProps) {
  const Comp = asChild ? Slot : "header";
  return (
    <Comp className={className} style={{ ...HEADER_STYLE, ...style }}>
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

const BODY_STYLE: CSSProperties = {
  flex: 1,
  minHeight: 0,
  position: "relative",
};

const SCROLLBAR_STYLE: CSSProperties = {
  display: "flex",
  userSelect: "none",
  touchAction: "none",
  padding: 2,
  width: 8,
};

const THUMB_STYLE: CSSProperties = {
  flex: 1,
  borderRadius: 4,
  background: "var(--border, rgba(0, 0, 0, 0.15))",
  position: "relative",
};

function SheetBody({ asChild, className, style, children }: SheetBodyProps) {
  if (asChild) {
    return (
      <Slot className={className} style={{ ...BODY_STYLE, ...style }}>
        {children}
      </Slot>
    );
  }

  return (
    <ScrollAreaRoot
      className={className}
      style={{ ...BODY_STYLE, overflow: "hidden", ...style }}
    >
      <ScrollAreaViewport
        style={{ height: "100%", width: "100%", overscrollBehavior: "contain" }}
      >
        {children}
      </ScrollAreaViewport>
      <ScrollAreaScrollbar orientation="vertical" style={SCROLLBAR_STYLE}>
        <ScrollAreaThumb style={THUMB_STYLE} />
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

const FOOTER_STYLE: CSSProperties = {
  flexShrink: 0,
};

function SheetFooter({
  asChild,
  className,
  style,
  children,
}: SheetFooterProps) {
  const Comp = asChild ? Slot : "footer";
  return (
    <Comp className={className} style={{ ...FOOTER_STYLE, ...style }}>
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
