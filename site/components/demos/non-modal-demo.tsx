"use client";

import { useState } from "react";
import { createStacksheet } from "@howells/stacksheet";

const { StacksheetProvider, useSheet } = createStacksheet({
  modal: false,
  side: "left",
  width: 280,
});

function SidebarSheet() {
  const { close } = useSheet();
  return (
    <div className="sheet-content">
      <h3>Sidebar</h3>
      <p>
        This is a non-modal sheet. The page behind it remains fully interactive —
        try clicking the counter or typing in the input.
      </p>
      <p>No overlay, no scroll lock, no focus trap.</p>
      <button className="demo-btn" onClick={close} type="button">
        Close
      </button>
    </div>
  );
}

function InteractiveContent() {
  const { open } = useSheet();
  const [count, setCount] = useState(0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "center",
        width: "100%",
      }}
    >
      <button
        className="demo-btn"
        onClick={() => open(SidebarSheet, {})}
        type="button"
      >
        Open sidebar
      </button>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginTop: 8,
        }}
      >
        <button
          className="demo-btn"
          onClick={() => setCount((c) => c + 1)}
          type="button"
        >
          Count: {count}
        </button>
        <input
          type="text"
          placeholder="Type here..."
          aria-label="Test text input"
          style={{
            padding: "6px 12px",
            fontSize: 13,
            border: "1px solid var(--fd-border, #e5e5e5)",
            borderRadius: 999,
            background: "var(--fd-background, #fff)",
            color: "inherit",
          }}
        />
      </div>
      <p
        style={{
          fontSize: 12,
          color: "var(--fd-muted-foreground, #666)",
          textAlign: "center",
          margin: 0,
        }}
      >
        These controls stay interactive while the sheet is open
      </p>
    </div>
  );
}

export function NonModalDemo() {
  return (
    <StacksheetProvider>
      <div className="demo-preview" style={{ flexDirection: "column", gap: 8 }}>
        <InteractiveContent />
      </div>
    </StacksheetProvider>
  );
}
