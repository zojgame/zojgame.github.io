import type { ReactElement } from "react";
import { AddCircleForm } from "./AddCircleForm";
import { useSimulationStore } from "../store/useSimulationStore";

export function ControlPanel(): ReactElement {
  const circles = useSimulationStore((state) => state.circles);
  const isPaused = useSimulationStore((state) => state.isPaused);
  const currentPreset = useSimulationStore((state) => state.currentPreset);
  const applyPreset = useSimulationStore((state) => state.applyPreset);
  const removeCircle = useSimulationStore((state) => state.removeCircle);
  const reset = useSimulationStore((state) => state.reset);
  const setPaused = useSimulationStore((state) => state.setPaused);
  const togglePause = useSimulationStore((state) => state.togglePause);

  return (
    <aside className="control-panel">
      <div className="panel-header">
        <div>
          <h1>Circle Physics</h1>
          <p>{circles.length} active circles</p>
        </div>
        <span className={`status-pill ${isPaused ? "paused" : "running"}`}>
          {isPaused ? "Paused" : "Running"}
        </span>
      </div>

      <div className="button-row">
        <button type="button" className="primary-button" onClick={() => setPaused(false)}>
          Play
        </button>
        <button type="button" onClick={() => setPaused(true)}>
          Pause
        </button>
        <button type="button" onClick={togglePause}>
          Toggle
        </button>
        <button type="button" className="danger-button" onClick={reset}>
          Reset
        </button>
      </div>

      <label className="preset-field">
        Preset
        <select
          value={currentPreset}
          onChange={(event) => {
            if (event.target.value === "calm" || event.target.value === "active") {
              applyPreset(event.target.value);
            }
          }}
        >
          <option value="custom" disabled>
            Custom
          </option>
          <option value="calm">Calm</option>
          <option value="active">Active</option>
        </select>
      </label>

      <AddCircleForm />

      <div className="circle-list">
        <h2>Objects</h2>
        {circles.length === 0 ? (
          <p className="empty-state">No circles in the world.</p>
        ) : (
          circles.map((circle) => (
            <div className="circle-row" key={circle.id}>
              <span className="color-swatch" style={{ backgroundColor: circle.color }} />
              <div>
                <strong>r{circle.radius}</strong>
                <span>
                  ({circle.x}, {circle.y}) / ({circle.velocityX}, {circle.velocityY})
                </span>
              </div>
              <button type="button" onClick={() => removeCircle(circle.id)} aria-label="Remove">
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
