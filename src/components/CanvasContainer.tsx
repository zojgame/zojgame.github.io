import { useEffect, useRef } from "react";
import type { ReactElement } from "react";
import { Engine } from "../Engine";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../simulationConstants";
import { useSimulationStore } from "../store/useSimulationStore";
import type { CircleConfig } from "../store/useSimulationStore";
import { hexToRgba } from "../utils/color";

function syncEngineCircles(engine: Engine, circles: readonly CircleConfig[]): void {
  engine.reset();

  for (const circle of circles) {
    engine.addCircle({
      id: circle.id,
      x: circle.x,
      y: circle.y,
      velocityX: circle.velocityX,
      velocityY: circle.velocityY,
      radius: circle.radius,
      color: hexToRgba(circle.color),
    });
  }
}

export function CanvasContainer(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const engine = Engine.instance(canvasRef.current, WORLD_WIDTH, WORLD_HEIGHT, {
      renderer: {
        backgroundColor: [0.025, 0.03, 0.04, 1],
      },
    });

    if (!engine) {
      return undefined;
    }

    const initialState = useSimulationStore.getState();
    syncEngineCircles(engine, initialState.circles);

    if (initialState.isPaused) {
      engine.pause();
    } else {
      engine.start();
    }

    const unsubscribe = useSimulationStore.subscribe((state, previousState) => {
      if (state.circles !== previousState.circles) {
        syncEngineCircles(engine, state.circles);
      }

      if (state.isPaused !== previousState.isPaused) {
        if (state.isPaused) {
          engine.pause();
        } else {
          engine.start();
        }
      }
    });

    return () => {
      unsubscribe();
      Engine.destroyInstance();
    };
  }, []);

  return (
    <section className="canvas-panel" aria-label="Circle simulation viewport">
      <canvas ref={canvasRef} className="simulation-canvas" />
    </section>
  );
}
