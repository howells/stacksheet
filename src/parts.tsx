import {
	Root as ScrollAreaRoot,
	Scrollbar as ScrollAreaScrollbar,
	Thumb as ScrollAreaThumb,
	Viewport as ScrollAreaViewport,
} from "@radix-ui/react-scroll-area";
import { Slot } from "@radix-ui/react-slot";
import {
	type CSSProperties,
	type KeyboardEvent as ReactKeyboardEvent,
	type ReactNode,
	useEffect,
} from "react";
import { ArrowLeftIcon, XIcon } from "./icons";
import { useSheetPanel } from "./panel-context";

/**
 * Compose className strings without injecting defaults the caller didn't ask
 * for. When `asChild` is set, the parts in this file render via Radix Slot
 * onto a consumer-supplied element — so any default visual classes the
 * library applies would clash with the consumer's own styling (e.g. our
 * `rounded-md` would override their `rounded-full`). We solve this by
 * dropping decorative defaults entirely on `asChild`, while keeping
 * structural classes (e.g. `shrink-0`, `min-h-0 flex-1`) that the
 * panel layout depends on.
 */
function joinClasses(...parts: Array<string | undefined>): string | undefined {
	const out = parts.filter(Boolean).join(" ").trim();
	return out.length > 0 ? out : undefined;
}

// ── Sheet.Handle ────────────────────────────────

export interface SheetHandleProps {
	/** Render as child element, merging props */
	asChild?: boolean;
	/** Custom handle content. Defaults to a centered grab bar. */
	children?: ReactNode;
	className?: string;
	style?: CSSProperties;
}

function SheetHandle({
	asChild,
	className,
	style,
	children,
}: SheetHandleProps) {
	const { close, back, isNested } = useSheetPanel();
	const dismiss = isNested ? back : close;
	const Comp = asChild ? Slot : "div";
	const defaults = asChild
		? undefined
		: "flex shrink-0 cursor-grab touch-none items-center justify-center pt-4 pb-1";
	return (
		<Comp
			aria-label="Dismiss"
			className={joinClasses(defaults, className)}
			data-stacksheet-handle=""
			onClick={dismiss}
			onKeyDown={(e: ReactKeyboardEvent) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					dismiss();
				}
			}}
			role="button"
			style={style}
			tabIndex={0}
		>
			{children ?? (
				<div aria-hidden="true" className="h-1 w-9 rounded-sm bg-current/25" />
			)}
		</Comp>
	);
}

// ── Sheet.Header ────────────────────────────────

export interface SheetHeaderProps {
	asChild?: boolean;
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
}

function SheetHeader({
	asChild,
	className,
	style,
	children,
}: SheetHeaderProps) {
	const Comp = asChild ? Slot : "header";
	// Keep `shrink-0` even on asChild — without it, header collapses in a
	// flex-column panel layout. Drop the rest (decorative).
	const defaults = asChild
		? "shrink-0"
		: "flex h-14 shrink-0 items-center justify-between border-b px-6";
	return (
		<Comp className={joinClasses(defaults, className)} style={style}>
			{children}
		</Comp>
	);
}

// ── Sheet.Title ─────────────────────────────────

export interface SheetTitleProps {
	asChild?: boolean;
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
}

function SheetTitle({ asChild, className, style, children }: SheetTitleProps) {
	const { panelId } = useSheetPanel();
	const Comp = asChild ? Slot : "h2";
	const defaults = asChild ? undefined : "font-semibold text-sm";
	return (
		<Comp
			className={joinClasses(defaults, className)}
			id={`${panelId}-title`}
			style={style}
		>
			{children}
		</Comp>
	);
}

// ── Sheet.Description ───────────────────────────

export interface SheetDescriptionProps {
	asChild?: boolean;
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
}

function SheetDescription({
	asChild,
	className,
	style,
	children,
}: SheetDescriptionProps) {
	const { panelId, registerDescription } = useSheetPanel();

	useEffect(() => registerDescription(), [registerDescription]);
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
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
}

function SheetBody({ asChild, className, style, children }: SheetBodyProps) {
	if (asChild) {
		// `relative min-h-0 flex-1` is structural — required for the panel's
		// flex-column layout to give the body the remaining height. Kept on
		// asChild because dropping it would break the layout silently.
		return (
			<Slot
				className={joinClasses("relative min-h-0 flex-1", className)}
				data-stacksheet-no-drag=""
				style={style}
			>
				{children}
			</Slot>
		);
	}

	return (
		<ScrollAreaRoot
			className={joinClasses(
				"relative flex min-h-0 flex-1 flex-col overflow-hidden",
				className,
			)}
			data-stacksheet-no-drag=""
			style={style}
		>
			<ScrollAreaViewport className="min-h-0 w-full flex-1 overscroll-contain">
				{children}
			</ScrollAreaViewport>
			<ScrollAreaScrollbar
				className="flex w-2 touch-none select-none p-0.5"
				orientation="vertical"
			>
				<ScrollAreaThumb className="relative flex-1 rounded bg-current/15" />
			</ScrollAreaScrollbar>
		</ScrollAreaRoot>
	);
}

// ── Sheet.Footer ────────────────────────────────

export interface SheetFooterProps {
	asChild?: boolean;
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
}

function SheetFooter({
	asChild,
	className,
	style,
	children,
}: SheetFooterProps) {
	const Comp = asChild ? Slot : "footer";
	// Same logic as Header: keep `shrink-0` for layout integrity.
	const defaults = asChild
		? "shrink-0"
		: "flex shrink-0 items-center gap-2 border-t px-6 py-3";
	return (
		<Comp className={joinClasses(defaults, className)} style={style}>
			{children}
		</Comp>
	);
}

// ── Sheet.Close ─────────────────────────────────

export interface SheetCloseProps {
	asChild?: boolean;
	/** Custom content. Defaults to an X icon. */
	children?: ReactNode;
	className?: string;
	style?: CSSProperties;
}

function SheetClose({ asChild, className, style, children }: SheetCloseProps) {
	const { close } = useSheetPanel();
	const Comp = asChild ? Slot : "button";
	const defaults = asChild
		? undefined
		: "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-inherit opacity-60 transition-opacity duration-150 hover:opacity-100";
	return (
		<Comp
			aria-label={children ? undefined : "Close"}
			className={joinClasses(defaults, className)}
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
	/** Custom content. Defaults to an arrow-left icon. */
	children?: ReactNode;
	className?: string;
	style?: CSSProperties;
}

function SheetBack({ asChild, className, style, children }: SheetBackProps) {
	const { back, isNested } = useSheetPanel();

	if (!isNested) {
		return null;
	}

	const Comp = asChild ? Slot : "button";
	const defaults = asChild
		? undefined
		: "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-inherit opacity-60 transition-opacity duration-150 hover:opacity-100";
	return (
		<Comp
			aria-label={children ? undefined : "Back"}
			className={joinClasses(defaults, className)}
			onClick={back}
			style={style}
			type={asChild ? undefined : "button"}
		>
			{children ?? <ArrowLeftIcon />}
		</Comp>
	);
}

// ── Sheet namespace ─────────────────────────────

/**
 * Composable sheet parts for building custom panel layouts.
 *
 * Use with `layout="composable"` on the provider to opt into
 * composable mode — no auto header or scroll wrapper, full control
 * over the panel's structure.
 *
 * `Sheet.Title` and `Sheet.Description` are linked to the panel's
 * `aria-labelledby` and `aria-describedby` via matching IDs.
 *
 * **`asChild` contract:** when `asChild` is set, the library passes through
 * onClick handlers, aria attributes, IDs and data-attrs only — decorative
 * defaults like `rounded-md`, `h-8 w-8`, `font-semibold`, opacity, etc.
 * are dropped so the consumer's element fully controls its own visuals.
 * Structural classes required for the panel layout to function (e.g.
 * `shrink-0` on Header/Footer, `min-h-0 flex-1` on Body) are kept.
 */
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
