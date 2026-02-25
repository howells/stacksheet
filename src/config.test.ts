import { describe, expect, it } from "vitest";
import { resolveConfig } from "./config";

describe("resolveConfig", () => {
  it("returns all defaults when called with no args", () => {
    const config = resolveConfig();
    expect(config.maxDepth).toBe(Number.POSITIVE_INFINITY);
    expect(config.closeOnEscape).toBe(true);
    expect(config.closeOnBackdrop).toBe(true);
    expect(config.showOverlay).toBe(true);
    expect(config.lockScroll).toBe(true);
    expect(config.width).toBe(420);
    expect(config.maxWidth).toBe("90vw");
    expect(config.breakpoint).toBe(768);
    expect(config.zIndex).toBe(100);
    expect(config.ariaLabel).toBe("Sheet dialog");
    expect(config.drag).toBe(true);
    expect(config.closeThreshold).toBe(0.25);
    expect(config.velocityThreshold).toBe(0.5);
    expect(config.dismissible).toBe(true);
    expect(config.modal).toBe(true);
    expect(config.shouldScaleBackground).toBe(false);
    expect(config.scaleBackgroundAmount).toBe(0.97);
  });

  it("resolves responsive side defaults", () => {
    const config = resolveConfig();
    expect(config.side).toEqual({ desktop: "right", mobile: "bottom" });
  });

  it("resolves string side to both desktop and mobile", () => {
    const config = resolveConfig({ side: "left" });
    expect(config.side).toEqual({ desktop: "left", mobile: "left" });
  });

  it("resolves responsive side with partial override", () => {
    const config = resolveConfig({ side: { desktop: "left" } as never });
    expect(config.side.desktop).toBe("left");
    expect(config.side.mobile).toBe("bottom");
  });

  it("resolves spring preset string", () => {
    const config = resolveConfig({ spring: "subtle" });
    expect(config.spring.damping).toBe(30);
    expect(config.spring.stiffness).toBe(300);
    expect(config.spring.mass).toBe(1);
  });

  it("resolves partial spring config", () => {
    const config = resolveConfig({ spring: { damping: 50 } });
    expect(config.spring.damping).toBe(50);
    expect(config.spring.stiffness).toBe(400);
    expect(config.spring.mass).toBe(1);
  });

  it("resolves stacking defaults", () => {
    const config = resolveConfig();
    expect(config.stacking.scaleStep).toBe(0.04);
    expect(config.stacking.offsetStep).toBe(16);
    expect(config.stacking.radius).toBe(12);
    expect(config.stacking.renderThreshold).toBe(3);
  });

  // ── Snap point defaults ──────────────────────

  it("defaults snapPoints to empty array", () => {
    const config = resolveConfig();
    expect(config.snapPoints).toEqual([]);
  });

  it("defaults snapToSequentialPoints to false", () => {
    const config = resolveConfig();
    expect(config.snapToSequentialPoints).toBe(false);
  });

  it("passes through snapPoints config", () => {
    const config = resolveConfig({ snapPoints: [0.3, 0.6, 1] });
    expect(config.snapPoints).toEqual([0.3, 0.6, 1]);
  });

  it("passes through snap callbacks", () => {
    const onChange = () => undefined;
    const config = resolveConfig({
      snapPointIndex: 1,
      onSnapPointChange: onChange,
      snapToSequentialPoints: true,
    });
    expect(config.snapPointIndex).toBe(1);
    expect(config.onSnapPointChange).toBe(onChange);
    expect(config.snapToSequentialPoints).toBe(true);
  });

  // ── Close reason callback ────────────────────

  it("passes through onCloseComplete with reason signature", () => {
    const onClose = (_reason: string) => undefined;
    const config = resolveConfig({ onCloseComplete: onClose });
    expect(config.onCloseComplete).toBe(onClose);
  });

  it("allows overriding all values", () => {
    const config = resolveConfig({
      maxDepth: 3,
      closeOnEscape: false,
      closeOnBackdrop: false,
      showOverlay: false,
      lockScroll: false,
      width: 500,
      maxWidth: "80vw",
      breakpoint: 640,
      zIndex: 200,
      ariaLabel: "Custom",
      drag: false,
      closeThreshold: 0.5,
      velocityThreshold: 1,
      dismissible: false,
      modal: false,
      shouldScaleBackground: true,
      scaleBackgroundAmount: 0.9,
    });
    expect(config.maxDepth).toBe(3);
    expect(config.closeOnEscape).toBe(false);
    expect(config.width).toBe(500);
    expect(config.zIndex).toBe(200);
    expect(config.drag).toBe(false);
    expect(config.modal).toBe(false);
  });
});
