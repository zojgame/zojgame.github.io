import type { ReactElement } from "react";
import { CanvasContainer } from "./components/CanvasContainer";
import { ControlPanel } from "./components/ControlPanel";
import "./styles.css";

export default function App(): ReactElement {
  return (
    <main className="app-shell">
      <CanvasContainer />
      <ControlPanel />
    </main>
  );
}
