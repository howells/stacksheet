"use client";

import dynamic from "next/dynamic";

function demoFallback(label: string) {
	return (
		<div className="mt-6 rounded-2xl border border-zinc-200/80 bg-white/60 px-4 py-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
			Loading {label} demo...
		</div>
	);
}

export const PlaygroundDemo = dynamic(
	() => import("./playground-demo").then((mod) => mod.PlaygroundDemo),
	{
		loading: () => demoFallback("playground"),
		ssr: false,
	},
);

export const DefaultDemo = dynamic(
	() => import("./default-demo").then((mod) => mod.DefaultDemo),
	{
		loading: () => demoFallback("default"),
		ssr: false,
	},
);

export const BodyScaleDemo = dynamic(
	() => import("./body-scale-demo").then((mod) => mod.BodyScaleDemo),
	{
		loading: () => demoFallback("body scale"),
		ssr: false,
	},
);

export const NonModalDemo = dynamic(
	() => import("./non-modal-demo").then((mod) => mod.NonModalDemo),
	{
		loading: () => demoFallback("non-modal"),
		ssr: false,
	},
);

export const DragDemo = dynamic(
	() => import("./drag-demo").then((mod) => mod.DragDemo),
	{
		loading: () => demoFallback("drag"),
		ssr: false,
	},
);

export const SideDemo = dynamic(
	() => import("./side-demo").then((mod) => mod.SideDemo),
	{
		loading: () => demoFallback("side"),
		ssr: false,
	},
);

export const ConfigDemo = dynamic(
	() => import("./config-demo").then((mod) => mod.ConfigDemo),
	{
		loading: () => demoFallback("config"),
		ssr: false,
	},
);

export const NavigateDemo = dynamic(
	() => import("./navigate-demo").then((mod) => mod.NavigateDemo),
	{
		loading: () => demoFallback("navigate"),
		ssr: false,
	},
);

export const StackingDemo = dynamic(
	() => import("./stacking-demo").then((mod) => mod.StackingDemo),
	{
		loading: () => demoFallback("stacking"),
		ssr: false,
	},
);

export const ComposableDemo = dynamic(
	() => import("./composable-demo").then((mod) => mod.ComposableDemo),
	{
		loading: () => demoFallback("composable"),
		ssr: false,
	},
);
