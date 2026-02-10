import { createSheetStack } from "@howells/stacksheet";

const custom = createSheetStack<{ showcase: Record<string, never> }>({
  width: 520,
  spring: "bouncy",
  stacking: {
    scaleStep: 0.06,
    offsetStep: 32,
    opacityStep: 0.2,
    radius: 16,
    renderThreshold: 5,
  },
});

function ShowcaseContent({
  onClose,
}: {
  data: Record<string, never>;
  onClose: () => void;
}) {
  const actions = custom.useSheetStack();
  const state = custom.useSheetStackState();

  return (
    <div className="sheet-content">
      <span className="sheet-badge">Stack depth: {state.stack.length}</span>
      <h3>Custom Configuration</h3>
      <p>
        This sheet uses a wider panel (520px), the <code>"bouncy"</code> spring
        preset, and exaggerated stacking effects. Push more layers to see the
        amplified depth.
      </p>
      <div>
        <button
          className="btn btn-sm"
          onClick={() =>
            actions.push("showcase", `s-${state.stack.length + 1}`, {})
          }
          type="button"
        >
          Push Layer
        </button>
        {state.stack.length > 1 && (
          <button
            className="btn btn-sm"
            onClick={() => actions.pop()}
            type="button"
          >
            Pop
          </button>
        )}
        <button className="btn btn-sm" onClick={onClose} type="button">
          Close All
        </button>
      </div>
    </div>
  );
}

function Trigger() {
  const actions = custom.useSheetStack();
  return (
    <button
      className="btn"
      onClick={() => actions.open("showcase", "s-1", {})}
      type="button"
    >
      Open Custom Sheet
    </button>
  );
}

export function ConfigDemo() {
  return (
    <custom.SheetStackProvider content={{ showcase: ShowcaseContent }}>
      <section className="section">
        <h2>Configuration</h2>
        <p>
          Customize <code>width</code>, <code>spring</code> presets, and{" "}
          <code>stacking</code> depth effects. Spring presets include{" "}
          <code>"soft"</code>, <code>"subtle"</code>, <code>"natural"</code>,{" "}
          <code>"playful"</code>, <code>"bouncy"</code>, <code>"snappy"</code>,{" "}
          and <code>"stiff"</code> (default).
        </p>
        <div className="preview">
          <Trigger />
        </div>
      </section>
    </custom.SheetStackProvider>
  );
}
