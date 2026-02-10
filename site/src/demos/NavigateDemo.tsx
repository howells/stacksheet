import { createSheetStack } from "@howells/stacksheet";

const nav = createSheetStack<{
  "type-a": { label: string };
  "type-b": { label: string };
}>();

function TypeAContent({
  data,
  onClose,
}: {
  data: { label: string };
  onClose: () => void;
}) {
  const actions = nav.useSheetStack();
  return (
    <div className="sheet-content">
      <span className="sheet-badge">Type A</span>
      <h3>{data.label}</h3>
      <p>
        <code>navigate()</code> is smart — if the stack is empty it opens, if
        the top is the same type it replaces, and if different it pushes. Try
        navigating to Type B from here.
      </p>
      <div>
        <button
          className="btn btn-sm"
          onClick={() =>
            actions.navigate("type-b", "b-from-a", {
              label: "Type B (pushed from A)",
            })
          }
          type="button"
        >
          Navigate to B
        </button>
        <button className="btn btn-sm" onClick={onClose} type="button">
          Close
        </button>
      </div>
    </div>
  );
}

function TypeBContent({
  data,
  onClose,
}: {
  data: { label: string };
  onClose: () => void;
}) {
  const actions = nav.useSheetStack();
  return (
    <div className="sheet-content">
      <span className="sheet-badge">Type B</span>
      <h3>{data.label}</h3>
      <p>
        Since Type B is different from Type A, <code>navigate()</code> pushed it
        onto the stack. Navigate to B again and it will replace this one
        instead.
      </p>
      <div>
        <button
          className="btn btn-sm"
          onClick={() =>
            actions.navigate("type-b", "b-replaced", {
              label: "Type B (replaced)",
            })
          }
          type="button"
        >
          Navigate to B again
        </button>
        <button className="btn btn-sm" onClick={onClose} type="button">
          Close
        </button>
      </div>
    </div>
  );
}

function Triggers() {
  const actions = nav.useSheetStack();
  return (
    <div className="btn-group">
      <button
        className="btn btn-sm"
        onClick={() => actions.navigate("type-a", "a-1", { label: "Type A" })}
        type="button"
      >
        Navigate to A
      </button>
      <button
        className="btn btn-sm"
        onClick={() => actions.navigate("type-b", "b-1", { label: "Type B" })}
        type="button"
      >
        Navigate to B
      </button>
    </div>
  );
}

export function NavigateDemo() {
  return (
    <nav.SheetStackProvider
      content={{ "type-a": TypeAContent, "type-b": TypeBContent }}
    >
      <section className="section">
        <h2>Navigate</h2>
        <p>
          Smart navigation — <code>navigate()</code> opens, pushes, or replaces
          depending on the current stack state and the target type.
        </p>
        <div className="preview">
          <Triggers />
        </div>
      </section>
    </nav.SheetStackProvider>
  );
}
