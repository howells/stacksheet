"use client";

import { Sheet, createStacksheet, useSheetPanel } from "@howells/stacksheet";

const { StacksheetProvider, useSheet } = createStacksheet();

function DetailSheet({ title }: { title: string }) {
  const { isNested } = useSheetPanel();
  return (
    <>
      <Sheet.Handle />
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
          <Sheet.Back />
          <Sheet.Title>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
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
              {isNested
                ? "This is a stacked sheet. Notice the back button appeared automatically via Sheet.Back."
                : "This sheet uses composable parts for full layout control. Each section is a Sheet.* component."}
            </span>
          </Sheet.Description>
          <div style={{ marginTop: 16 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <p
                key={i}
                style={{
                  fontSize: 13,
                  color: "var(--fd-muted-foreground, #666)",
                  lineHeight: 1.6,
                  marginBottom: 12,
                }}
              >
                Scrollable content paragraph {i + 1}. The Sheet.Body wraps this
                in a Radix ScrollArea with a custom scrollbar.
              </p>
            ))}
          </div>
        </div>
      </Sheet.Body>
      <Sheet.Footer>
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--fd-border, #e5e5e5)",
          }}
        >
          <FooterAction />
        </div>
      </Sheet.Footer>
    </>
  );
}

function FooterAction() {
  const { push, close } = useSheet();
  const { isNested } = useSheetPanel();
  return (
    <div className="demo-btn-group">
      {!isNested && (
        <button
          className="demo-btn"
          onClick={() => push(DetailSheet, { title: "Stacked Sheet" })}
          type="button"
        >
          Push Sheet
        </button>
      )}
      <button className="demo-btn" onClick={close} type="button">
        Close
      </button>
    </div>
  );
}

function Triggers() {
  const { open } = useSheet();
  return (
    <button
      className="demo-btn"
      onClick={() => open(DetailSheet, { title: "Composable Sheet" })}
      type="button"
    >
      Open Sheet
    </button>
  );
}

export function ComposableDemo() {
  return (
    <StacksheetProvider renderHeader={false}>
      <div className="demo-preview">
        <Triggers />
      </div>
    </StacksheetProvider>
  );
}
