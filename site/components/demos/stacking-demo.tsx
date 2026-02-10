"use client";

import { createStacksheet } from "@howells/stacksheet";

const { StacksheetProvider, useSheet } = createStacksheet();

function LayerSheet({ depth }: { depth: number }) {
  const { push, pop, close } = useSheet();
  return (
    <div className="sheet-content">
      <span className="sheet-badge">Depth {depth}</span>
      <h3>Sheet Layer {depth}</h3>
      <p>
        Each pushed sheet scales down, offsets, and fades the layers behind it —
        creating an Apple-style depth effect.
      </p>
      <div>
        <button
          className="demo-btn"
          onClick={() => push(LayerSheet, { depth: depth + 1 })}
          type="button"
        >
          Push Another
        </button>
        <button className="demo-btn" onClick={pop} type="button">
          Pop
        </button>
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
      onClick={() => open(LayerSheet, { depth: 1 })}
      type="button"
    >
      Start Stack
    </button>
  );
}

export function StackingDemo() {
  return (
    <StacksheetProvider>
      <div className="demo-preview">
        <Trigger />
      </div>
    </StacksheetProvider>
  );
}
