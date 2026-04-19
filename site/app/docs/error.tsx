"use client";

export default function DocsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-start justify-center gap-4 px-8 py-16">
			<p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
				Docs error
			</p>
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
					This page failed to render
				</h1>
				<p className="max-w-prose text-sm leading-6 text-zinc-600 dark:text-zinc-400">
					{error.message ||
						"A runtime error interrupted the docs page. Try reloading the segment."}
				</p>
			</div>
			<button
				className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-4 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
				onClick={reset}
				type="button"
			>
				Try again
			</button>
		</div>
	);
}
