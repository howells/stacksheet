import { createSheetStack, type Side } from "@howells/stacksheet";

const rightSheet = createSheetStack<{ info: { side: Side } }>({
  side: "right",
});
const leftSheet = createSheetStack<{ info: { side: Side } }>({ side: "left" });
const bottomSheet = createSheetStack<{ info: { side: Side } }>({
  side: "bottom",
});

function InfoContent({
  data,
  onClose,
}: {
  data: { side: Side };
  onClose: () => void;
}) {
  return (
    <div className="sheet-content">
      <span className="sheet-badge">{data.side}</span>
      <h3>Side: {data.side}</h3>
      <p>
        This sheet slides in from the <strong>{data.side}</strong>. Set the{" "}
        <code>side</code> config to <code>"{data.side}"</code>, or use a
        responsive object like{" "}
        <code>{`{ desktop: "right", mobile: "bottom" }`}</code>.
      </p>
      <button className="btn" onClick={onClose} type="button">
        Close
      </button>
    </div>
  );
}

function RightTrigger() {
  const actions = rightSheet.useSheetStack();
  return (
    <button
      className="btn btn-sm"
      onClick={() => actions.open("info", "right", { side: "right" })}
      type="button"
    >
      Right
    </button>
  );
}

function LeftTrigger() {
  const actions = leftSheet.useSheetStack();
  return (
    <button
      className="btn btn-sm"
      onClick={() => actions.open("info", "left", { side: "left" })}
      type="button"
    >
      Left
    </button>
  );
}

function BottomTrigger() {
  const actions = bottomSheet.useSheetStack();
  return (
    <button
      className="btn btn-sm"
      onClick={() => actions.open("info", "bottom", { side: "bottom" })}
      type="button"
    >
      Bottom
    </button>
  );
}

export function SideDemo() {
  return (
    <rightSheet.SheetStackProvider content={{ info: InfoContent }}>
      <leftSheet.SheetStackProvider content={{ info: InfoContent }}>
        <bottomSheet.SheetStackProvider content={{ info: InfoContent }}>
          <section className="section">
            <h2>Side Position</h2>
            <p>
              Sheets can slide from the <code>right</code>, <code>left</code>,
              or <code>bottom</code>. By default, desktop uses right and mobile
              uses bottom.
            </p>
            <div className="preview">
              <div className="btn-group">
                <RightTrigger />
                <LeftTrigger />
                <BottomTrigger />
              </div>
            </div>
          </section>
        </bottomSheet.SheetStackProvider>
      </leftSheet.SheetStackProvider>
    </rightSheet.SheetStackProvider>
  );
}
