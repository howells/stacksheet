"use client";

import { useState } from "react";
import { Sheet, createStacksheet } from "@howells/stacksheet";

const { StacksheetProvider, useSheet } = createStacksheet({
  modal: false,
  side: "left",
  width: 280,
});

function SidebarSheet() {
  const { close } = useSheet();
  return (
    <>
      <Sheet.Header>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            height: 48,
            gap: 8,
          }}
        >
          <Sheet.Title>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Sidebar</span>
          </Sheet.Title>
          <div style={{ flex: 1 }} />
          <Sheet.Close />
        </div>
      </Sheet.Header>
      <Sheet.Body>
        <div style={{ padding: "0 16px" }}>
          <Sheet.Description>
            <span
              style={{ fontSize: 13, color: "var(--fd-muted-foreground, #666)" }}
            >
              This is a non-modal sheet. The page behind it remains fully
              interactive — try clicking the counter or typing in the input.
            </span>
          </Sheet.Description>
          <p
            style={{
              fontSize: 13,
              color: "var(--fd-muted-foreground, #666)",
              marginTop: 12,
            }}
          >
            No overlay, no scroll lock, no focus trap.
          </p>
        </div>
      </Sheet.Body>
      <Sheet.Footer>
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--fd-border, #e5e5e5)",
          }}
        >
          <button className="demo-btn" onClick={close} type="button">
            Close sidebar
          </button>
        </div>
      </Sheet.Footer>
    </>
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
    <StacksheetProvider renderHeader={false}>
      <div className="demo-preview" style={{ flexDirection: "column", gap: 8 }}>
        <InteractiveContent />
      </div>
    </StacksheetProvider>
  );
}
