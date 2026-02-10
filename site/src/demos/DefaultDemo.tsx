import { createSheetStack } from "@howells/stacksheet";

const sheet = createSheetStack<{ detail: Record<string, never> }>();

function DetailContent({
  onClose,
}: {
  data: Record<string, never>;
  onClose: () => void;
}) {
  return (
    <div className="sheet-content">
      <h3>Default Sheet</h3>
      <p>
        This is the simplest setup. Call <code>open()</code> with a type, id,
        and data object to display a sheet. The sheet slides in from the right
        on desktop and from the bottom on mobile.
      </p>
      <button className="btn" onClick={onClose} type="button">
        Close
      </button>
    </div>
  );
}

function AdHocContent({
  data,
  onClose,
}: {
  data: { label: string };
  onClose: () => void;
}) {
  return (
    <div className="sheet-content">
      <h3>Ad-Hoc Sheet</h3>
      <p>
        This sheet was pushed with a component reference instead of a type key.
        Label: <strong>{data.label}</strong>
      </p>
      <button className="btn" onClick={onClose} type="button">
        Close
      </button>
    </div>
  );
}

function Trigger() {
  const actions = sheet.useSheetStack();
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        className="btn"
        onClick={() => actions.open("detail", "1", {})}
        type="button"
      >
        Open Sheet
      </button>
      <button
        className="btn"
        onClick={() => actions.open(AdHocContent, { label: "hello" })}
        type="button"
      >
        Ad-Hoc Push
      </button>
    </div>
  );
}

export function DefaultDemo() {
  return (
    <sheet.SheetStackProvider content={{ detail: DetailContent }}>
      <section className="section">
        <h2>Default</h2>
        <p>The simplest setup — open and close a single sheet.</p>
        <div className="preview">
          <Trigger />
        </div>
      </section>
    </sheet.SheetStackProvider>
  );
}
