"use client";

import { type ReactNode, useRef, useState } from "react";
import { type Side, createStacksheet } from "@howells/stacksheet";

type DemoMap = {
  DragContent: { side: string; description: string };
};

const descriptions: Record<string, string> = {
  right: "Drag this panel to the right to dismiss it.",
  left: "Drag this panel to the left to dismiss it.",
  bottom: "Drag this panel downward to dismiss it.",
};

function DragContent({ side, description }: DemoMap["DragContent"]) {
  return (
    <div className="sheet-content">
      <h3>Drag to dismiss — {side}</h3>
      <p>{description}</p>
      <div
        style={{
          padding: 12,
          marginBottom: 12,
          border: "1px dashed var(--fd-border, #e5e5e5)",
          borderRadius: 8,
          background: "var(--fd-muted, #f5f5f5)",
        }}
        data-stacksheet-no-drag=""
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--fd-muted-foreground, #666)",
            marginBottom: 8,
          }}
        >
          No-drag zone
        </p>
        <input
          type="text"
          placeholder="Text selection works here"
          aria-label="Text input in no-drag zone"
          style={{
            width: "100%",
            padding: "6px 10px",
            fontSize: 13,
            border: "1px solid var(--fd-border, #e5e5e5)",
            borderRadius: 6,
            background: "var(--fd-background, #fff)",
            color: "inherit",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}

const sheetMap = { DragContent } as const;

// Single instance, recreated when side changes
type StacksheetReturn = ReturnType<typeof createStacksheet<DemoMap>>;

function DemoInstance({
  side,
  children,
}: { side: Side; children: (actions: StacksheetReturn["store"]) => ReactNode }) {
  const instanceRef = useRef<StacksheetReturn | null>(null);
  if (!instanceRef.current) {
    instanceRef.current = createStacksheet<DemoMap>({ side });
  }
  const { StacksheetProvider, store } = instanceRef.current;

  return (
    <StacksheetProvider sheets={sheetMap}>
      {children(store)}
    </StacksheetProvider>
  );
}

export function DragDemo() {
  const [side, setSide] = useState<Side>("right");
  const [version, setVersion] = useState(0);

  function changeSide(s: Side) {
    setSide(s);
    setVersion((v) => v + 1);
  }

  const sides: Side[] = ["right", "left", "bottom"];

  return (
    <DemoInstance key={version} side={side}>
      {(store) => {
        function openSheet(s: string) {
          store.getState().open("DragContent", `drag-${Date.now()}`, {
            side: s,
            description: descriptions[s],
          });
        }
        return (
          <div className="demo-preview" style={{ flexDirection: "column", gap: 12 }}>
            <div className="demo-btn-group">
              {sides.map((s) => (
                <button
                  key={s}
                  className="demo-btn"
                  onClick={() => {
                    if (s !== side) {
                      changeSide(s);
                    } else {
                      openSheet(s);
                    }
                  }}
                  type="button"
                  style={
                    s === side
                      ? {
                          background: "var(--fd-foreground, #111)",
                          color: "var(--fd-background, #fff)",
                          borderColor: "var(--fd-foreground, #111)",
                        }
                      : undefined
                  }
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              className="demo-btn"
              onClick={() => openSheet(side)}
              type="button"
            >
              Open {side} sheet
            </button>
          </div>
        );
      }}
    </DemoInstance>
  );
}
