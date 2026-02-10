"use client";

import { createStacksheet } from "@howells/stacksheet";

const { StacksheetProvider, useSheet, useStacksheetState } = createStacksheet({
  width: 520,
  spring: "snappy",
  stacking: {
    scaleStep: 0.06,
    offsetStep: 32,
    opacityStep: 0.2,
    radius: 16,
    renderThreshold: 5,
  },
});

function ShowcaseSheet() {
  const { push, pop, close } = useSheet();
  const { stack } = useStacksheetState();
  return (
    <div className="sheet-content">
      <span className="sheet-badge">Stack depth: {stack.length}</span>
      <h3>Custom Configuration</h3>
      <p>
        This sheet uses a wider panel (520px), the <code>"snappy"</code> spring
        preset, and exaggerated stacking effects. Push more layers to see the
        amplified depth.
      </p>
      <div>
        <button
          className="demo-btn"
          onClick={() => push(ShowcaseSheet, {})}
          type="button"
        >
          Push Layer
        </button>
        {stack.length > 1 && (
          <button className="demo-btn" onClick={pop} type="button">
            Pop
          </button>
        )}
        <button className="demo-btn" onClick={close} type="button">
          Close All
        </button>
      </div>
    </div>
  );
}

function Trigger() {
  const { open } = useSheet();
  return (
    <button
      className="demo-btn"
      onClick={() => open(ShowcaseSheet, {})}
      type="button"
    >
      Open Custom Sheet
    </button>
  );
}

export function ConfigDemo() {
  return (
    <StacksheetProvider>
      <div className="demo-preview">
        <Trigger />
      </div>
    </StacksheetProvider>
  );
}
