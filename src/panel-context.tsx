import { createContext, useContext } from "react";
import type { Side } from "./types";

export interface SheetPanelContextValue {
  /** Close the entire sheet stack */
  close: () => void;
  /** Pop the top sheet (go back one level) */
  back: () => void;
  /** Whether the stack has more than one sheet */
  isNested: boolean;
  /** Whether this is the top (active) sheet */
  isTop: boolean;
  /** Unique ID prefix for this panel (for aria-labelledby linking) */
  panelId: string;
  /** Current resolved side (left/right/bottom) */
  side: Side;
  /** Whether a Sheet.Description is mounted inside this panel */
  hasDescription: boolean;
  /** Called by Sheet.Description on mount to register its presence */
  registerDescription: () => () => void;
}

export const SheetPanelContext = createContext<SheetPanelContextValue | null>(
  null
);

/**
 * Access the current sheet panel's context.
 * Must be called inside a component rendered by the sheet stack.
 */
export function useSheetPanel(): SheetPanelContextValue {
  const ctx = useContext(SheetPanelContext);
  if (!ctx) {
    throw new Error(
      "Sheet.* components must be used inside a sheet panel. " +
        "They should be rendered by a component opened via actions.open(), push(), etc."
    );
  }
  return ctx;
}
