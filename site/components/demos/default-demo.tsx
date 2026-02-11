"use client";

import { createStacksheet } from "@howells/stacksheet";

const { StacksheetProvider, useSheet } = createStacksheet();

function ProfileSheet({ name }: { name: string }) {
  const { close } = useSheet();
  return (
    <div className="sheet-content">
      <h3>{name}</h3>
      <p>
        This sheet was opened by passing a component directly to{" "}
        <code>open()</code>. No registration, no type map — just a component
        and its props.
      </p>
      <button className="demo-btn" onClick={close} type="button">
        Close
      </button>
    </div>
  );
}

function Trigger() {
  const { open } = useSheet();
  return (
    <button
      className="demo-btn demo-btn-primary"
      onClick={() => open(ProfileSheet, { name: "Jane Doe" })}
      type="button"
    >
      Open Sheet
    </button>
  );
}

export function DefaultDemo() {
  return (
    <StacksheetProvider>
      <div className="demo-preview">
        <Trigger />
      </div>
    </StacksheetProvider>
  );
}
