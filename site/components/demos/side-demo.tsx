"use client";

import { createStacksheet, type Side } from "@howells/stacksheet";

const {
  StacksheetProvider: RightProvider,
  useSheet: useRightSheet,
} = createStacksheet({ side: "right" });

const {
  StacksheetProvider: LeftProvider,
  useSheet: useLeftSheet,
} = createStacksheet({ side: "left" });

const {
  StacksheetProvider: BottomProvider,
  useSheet: useBottomSheet,
} = createStacksheet({ side: "bottom" });

function InfoSheet({ side }: { side: Side }) {
  return (
    <div className="sheet-content">
      <span className="sheet-badge">{side}</span>
      <h3>Side: {side}</h3>
      <p>
        This sheet slides in from the <strong>{side}</strong>. Set the{" "}
        <code>side</code> config to <code>"{side}"</code>, or use a responsive
        object like{" "}
        <code>{`{ desktop: "right", mobile: "bottom" }`}</code>.
      </p>
    </div>
  );
}

function RightTrigger() {
  const { open } = useRightSheet();
  return (
    <button
      className="demo-btn"
      onClick={() => open(InfoSheet, { side: "right" })}
      type="button"
    >
      Right
    </button>
  );
}

function LeftTrigger() {
  const { open } = useLeftSheet();
  return (
    <button
      className="demo-btn"
      onClick={() => open(InfoSheet, { side: "left" })}
      type="button"
    >
      Left
    </button>
  );
}

function BottomTrigger() {
  const { open } = useBottomSheet();
  return (
    <button
      className="demo-btn"
      onClick={() => open(InfoSheet, { side: "bottom" })}
      type="button"
    >
      Bottom
    </button>
  );
}

export function SideDemo() {
  return (
    <RightProvider>
      <LeftProvider>
        <BottomProvider>
          <div className="demo-preview">
            <div className="demo-btn-group">
              <RightTrigger />
              <LeftTrigger />
              <BottomTrigger />
            </div>
          </div>
        </BottomProvider>
      </LeftProvider>
    </RightProvider>
  );
}
