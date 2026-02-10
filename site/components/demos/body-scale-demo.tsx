"use client";

import { Sheet, createStacksheet, useSheetPanel } from "@howells/stacksheet";

const { StacksheetProvider, useSheet } = createStacksheet({
  shouldScaleBackground: true,
  side: "bottom",
});

function BottomSheet() {
  const { close } = useSheet();
  return (
    <>
      <Sheet.Handle />
      <Sheet.Body>
        <div style={{ padding: "0 16px 16px" }}>
          <Sheet.Title>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Body Scale</span>
          </Sheet.Title>
          <Sheet.Description>
            <span
              style={{
                fontSize: 13,
                color: "var(--fd-muted-foreground, #666)",
                display: "block",
                marginTop: 8,
              }}
            >
              Notice how the content behind this sheet scaled down with a smooth
              transition. This creates an iOS-style depth effect.
            </span>
          </Sheet.Description>
          <button
            className="demo-btn"
            onClick={close}
            type="button"
            style={{ marginTop: 16 }}
          >
            Close
          </button>
        </div>
      </Sheet.Body>
    </>
  );
}

function Trigger() {
  const { open } = useSheet();
  return (
    <button
      className="demo-btn"
      onClick={() => open(BottomSheet, {})}
      type="button"
    >
      Open bottom sheet
    </button>
  );
}

export function BodyScaleDemo() {
  return (
    <StacksheetProvider renderHeader={false}>
      <div
        data-stacksheet-wrapper=""
        style={{
          borderRadius: 12,
          border: "1px solid var(--fd-border, #e5e5e5)",
          background: "var(--fd-muted, #f5f5f5)",
          padding: 24,
          marginTop: "1.5rem",
          transformOrigin: "center top",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {["Inbox", "Drafts", "Archive", "Sent"].map((label) => (
            <div
              key={label}
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                background: "var(--fd-background, #fff)",
                border: "1px solid var(--fd-border, #e5e5e5)",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {label}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Trigger />
        </div>
      </div>
    </StacksheetProvider>
  );
}
