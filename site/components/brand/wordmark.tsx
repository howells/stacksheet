import pkg from "@howells/stacksheet/package.json";

export function Wordmark() {
  return (
    <span className="ss-wordmark">
      Stacksheet
      <span className="ss-version-badge">v{pkg.version}</span>
    </span>
  );
}
