import { createSheetStack } from "@howells/stacksheet";

const stack = createSheetStack<{ layer: { depth: number } }>();

function LayerContent({
  data,
  onClose,
}: {
  data: { depth: number };
  onClose: () => void;
}) {
  const actions = stack.useSheetStack();

  return (
    <div className="sheet-content">
      <span className="sheet-badge">Depth {data.depth}</span>
      <h3>Sheet Layer {data.depth}</h3>
      <p>
        Each pushed sheet scales down, offsets, and fades the layers behind it —
        creating an Apple-style depth effect.
      </p>
      <div>
        <button
          className="btn btn-sm"
          onClick={() =>
            actions.push("layer", `layer-${data.depth + 1}`, {
              depth: data.depth + 1,
            })
          }
          type="button"
        >
          Push Another
        </button>
        <button
          className="btn btn-sm"
          onClick={() => actions.pop()}
          type="button"
        >
          Pop
        </button>
        <button className="btn btn-sm" onClick={onClose} type="button">
          Close All
        </button>
      </div>
    </div>
  );
}

function Trigger() {
  const actions = stack.useSheetStack();
  return (
    <button
      className="btn"
      onClick={() => actions.open("layer", "layer-1", { depth: 1 })}
      type="button"
    >
      Start Stack
    </button>
  );
}

export function StackingDemo() {
  return (
    <stack.SheetStackProvider content={{ layer: LayerContent }}>
      <section className="section">
        <h2>Stacking</h2>
        <p>
          Push multiple sheets onto the stack with Apple-style depth animations.
          Each layer gets progressively scaled, offset, and faded.
        </p>
        <div className="preview">
          <Trigger />
        </div>
      </section>
    </stack.SheetStackProvider>
  );
}
