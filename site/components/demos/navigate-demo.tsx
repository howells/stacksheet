"use client";

import { createStacksheet } from "@howells/stacksheet";

const { StacksheetProvider, useSheet } = createStacksheet();

function TypeASheet({ label }: { label: string }) {
  const { navigate, close } = useSheet();
  return (
    <div className="sheet-content">
      <span className="sheet-badge">Type A</span>
      <h3>{label}</h3>
      <p>
        <code>navigate()</code> is smart — if the stack is empty it opens, if
        the top is the same component it replaces, and if different it pushes.
        Try navigating to Type B from here.
      </p>
      <div>
        <button
          className="demo-btn"
          onClick={() =>
            navigate(TypeBSheet, { label: "Type B (pushed from A)" })
          }
          type="button"
        >
          Navigate to B
        </button>
        <button className="demo-btn" onClick={close} type="button">
          Close
        </button>
      </div>
    </div>
  );
}

function TypeBSheet({ label }: { label: string }) {
  const { navigate, close } = useSheet();
  return (
    <div className="sheet-content">
      <span className="sheet-badge">Type B</span>
      <h3>{label}</h3>
      <p>
        Since Type B is a different component from Type A,{" "}
        <code>navigate()</code> pushed it onto the stack. Navigate to B again
        and it will replace this one instead.
      </p>
      <div>
        <button
          className="demo-btn"
          onClick={() => navigate(TypeBSheet, { label: "Type B (replaced)" })}
          type="button"
        >
          Navigate to B again
        </button>
        <button className="demo-btn" onClick={close} type="button">
          Close
        </button>
      </div>
    </div>
  );
}

function Triggers() {
  const { navigate } = useSheet();
  return (
    <div className="demo-btn-group">
      <button
        className="demo-btn"
        onClick={() => navigate(TypeASheet, { label: "Type A" })}
        type="button"
      >
        Navigate to A
      </button>
      <button
        className="demo-btn"
        onClick={() => navigate(TypeBSheet, { label: "Type B" })}
        type="button"
      >
        Navigate to B
      </button>
    </div>
  );
}

export function NavigateDemo() {
  return (
    <StacksheetProvider>
      <div className="demo-preview">
        <Triggers />
      </div>
    </StacksheetProvider>
  );
}
