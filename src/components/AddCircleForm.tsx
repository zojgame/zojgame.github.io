import { FormEvent, useState } from "react";
import type { ReactElement } from "react";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../simulationConstants";
import { useSimulationStore } from "../store/useSimulationStore";

const INITIAL_FORM_STATE = {
  radius: 32,
  x: 120,
  y: 120,
  velocityX: 140,
  velocityY: 90,
  color: "#34b7ff",
};

export function AddCircleForm(): ReactElement {
  const addCircle = useSimulationStore((state) => state.addCircle);
  const [form, setForm] = useState(INITIAL_FORM_STATE);

  const updateNumber = (name: keyof Omit<typeof INITIAL_FORM_STATE, "color">, value: string) => {
    setForm((current) => ({
      ...current,
      [name]: Number(value),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    addCircle({
      radius: Math.max(4, form.radius),
      x: Math.min(Math.max(form.x, form.radius), WORLD_WIDTH - form.radius),
      y: Math.min(Math.max(form.y, form.radius), WORLD_HEIGHT - form.radius),
      velocityX: form.velocityX,
      velocityY: form.velocityY,
      color: form.color,
    });
  };

  return (
    <form className="control-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Radius
          <input
            type="number"
            min="4"
            max="120"
            value={form.radius}
            onChange={(event) => updateNumber("radius", event.target.value)}
          />
        </label>

        <label>
          X
          <input
            type="number"
            min="0"
            max={WORLD_WIDTH}
            value={form.x}
            onChange={(event) => updateNumber("x", event.target.value)}
          />
        </label>

        <label>
          Y
          <input
            type="number"
            min="0"
            max={WORLD_HEIGHT}
            value={form.y}
            onChange={(event) => updateNumber("y", event.target.value)}
          />
        </label>

        <label>
          VX
          <input
            type="number"
            min="-800"
            max="800"
            value={form.velocityX}
            onChange={(event) => updateNumber("velocityX", event.target.value)}
          />
        </label>

        <label>
          VY
          <input
            type="number"
            min="-800"
            max="800"
            value={form.velocityY}
            onChange={(event) => updateNumber("velocityY", event.target.value)}
          />
        </label>

        <label>
          Color
          <input
            type="color"
            value={form.color}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                color: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <button type="submit" className="primary-button">
        Add Circle
      </button>
    </form>
  );
}
