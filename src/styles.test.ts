import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function buildStyles() {
	const dir = mkdtempSync(join(tmpdir(), "stacksheet-css-"));
	const outFile = join(dir, "styles.css");

	try {
		execFileSync(
			"pnpm",
			[
				"exec",
				"tailwindcss",
				"-i",
				"./src/styles.css",
				"-o",
				outFile,
				"--minify",
			],
			{ cwd: process.cwd(), stdio: "pipe" },
		);

		return readFileSync(outFile, "utf8");
	} finally {
		rmSync(dir, { force: true, recursive: true });
	}
}

describe("styles.css", () => {
	it("ships Stacksheet utilities without Tailwind Preflight or theme globals", () => {
		const css = buildStyles();

		expect(css).toContain(".h-8{height:calc(var(--spacing,.25rem) * 8)}");
		expect(css).toContain(".w-8{width:calc(var(--spacing,.25rem) * 8)}");
		expect(css).toContain(
			".px-4{padding-inline:calc(var(--spacing,.25rem) * 4)}",
		);
		expect(css).toContain(
			".rounded-md{border-radius:var(--radius-md,.375rem)}",
		);

		expect(css).not.toContain(":root,:host");
		expect(css).not.toContain("box-sizing:border-box");
		expect(css).not.toContain("border-color:currentcolor");
	});
});
