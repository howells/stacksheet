import { useEffect, useState } from "react";
import { createSheetStack } from "@howells/stacksheet";
import { Docs } from "./components/Docs";
import { ConfigDemo } from "./demos/ConfigDemo";
import { DefaultDemo } from "./demos/DefaultDemo";
import { NavigateDemo } from "./demos/NavigateDemo";
import { SideDemo } from "./demos/SideDemo";
import { StackingDemo } from "./demos/StackingDemo";

const hero = createSheetStack<{ layer: { depth: number } }>({
  spring: "snappy",
});

function HeroLayer({
  data,
  onClose,
}: {
  data: { depth: number };
  onClose: () => void;
}) {
  const actions = hero.useSheetStack();
  const state = hero.useSheetStackState();

  return (
    <div className="sheet-content">
      <span className="sheet-badge">Layer {data.depth}</span>
      <h3>
        {data.depth === 1 ? "Welcome to Stacksheet" : `Layer ${data.depth}`}
      </h3>
      <p>
        {data.depth === 1
          ? "Push sheets onto a stack with Apple-style depth animations. Each layer scales, offsets, and fades the ones behind it. Try it."
          : `You're ${data.depth} layers deep. Each sheet behind this one has been scaled down and faded to create depth.`}
      </p>
      <div>
        <button
          className="btn btn-sm"
          onClick={() =>
            actions.push("layer", `hero-${data.depth + 1}`, {
              depth: data.depth + 1,
            })
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
          Close
        </button>
      </div>
    </div>
  );
}

function HeroTrigger() {
  const sheet = hero.useSheetStack();
  return (
    <button
      className="btn"
      onClick={() => sheet.open("layer", "hero-1", { depth: 1 })}
      type="button"
    >
      Try It
    </button>
  );
}

export function App() {
  const [page, setPage] = useState(
    window.location.hash === "#docs" ? "docs" : "demos",
  );

  useEffect(() => {
    const onHash = () => {
      setPage(window.location.hash === "#docs" ? "docs" : "demos");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <hero.SheetStackProvider content={{ layer: HeroLayer }}>
      {/* Hero */}
      <section className="hero">
        <h1>Stacksheet</h1>
        <p>Typed, animated sheet stacking for React.</p>
        <div className="hero-actions">
          <HeroTrigger />
          <a className="btn" href="#docs">
            Docs
          </a>
          <a
            className="btn"
            href="https://github.com/howells/stacksheet"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub &rarr;
          </a>
        </div>
        <a
          className="hero-link"
          href="https://www.npmjs.com/package/@howells/stacksheet"
          rel="noopener noreferrer"
          target="_blank"
        >
          npm
        </a>
      </section>

      {page === "docs" ? (
        <Docs />
      ) : (
        <div className="sections">
          <DefaultDemo />
          <StackingDemo />
          <SideDemo />
          <NavigateDemo />
          <ConfigDemo />
        </div>
      )}

      <footer className="footer">
        Built by{" "}
        <a
          href="https://github.com/howells"
          rel="noopener noreferrer"
          target="_blank"
        >
          Daniel Howells
        </a>
      </footer>
    </hero.SheetStackProvider>
  );
}
