import { CircleObject, createCircleObject } from "./CircleObject";
import { PhysicsWorld } from "./PhysicsWorld";
import { Renderer } from "./Renderer";
import type { RendererOptions } from "./Renderer";
import { Vector2D } from "./Vector2D";

export interface EngineOptions {
  maxDeltaTime?: number;
  renderer?: RendererOptions;
}

export interface AddCircleParams {
  id?: string;
  x: number;
  y: number;
  velocityX?: number;
  velocityY?: number;
  radius: number;
  mass?: number;
  color?: readonly [number, number, number, number];
}

export class Engine {
  private static activeInstance: Engine | null = null;
  private static nextCircleId = 1;

  private readonly world: PhysicsWorld;
  private readonly renderer: Renderer;
  private readonly canvas: HTMLCanvasElement;
  private readonly boundaryWidth: number;
  private readonly boundaryHeight: number;
  private readonly maxDeltaTime: number;

  private animationFrameId: number | null = null;
  private lastFrameTime = 0;
  private running = false;
  private disposed = false;

  public constructor(
    canvas: HTMLCanvasElement,
    boundaryWidth: number,
    boundaryHeight: number,
    options: EngineOptions = {},
  ) {
    this.canvas = canvas;
    this.boundaryWidth = boundaryWidth;
    this.boundaryHeight = boundaryHeight;
    this.world = new PhysicsWorld(boundaryWidth, boundaryHeight);
    this.renderer = new Renderer(canvas, boundaryWidth, boundaryHeight, options.renderer);
    this.maxDeltaTime = options.maxDeltaTime ?? 1 / 30;

    this.renderer.init();
    this.renderOnce();
  }

  public static instance(
    canvas: HTMLCanvasElement | null,
    boundaryWidth: number,
    boundaryHeight: number,
    options: EngineOptions = {},
  ): Engine | null {
    if (!canvas) {
      return null;
    }

    if (Engine.activeInstance) {
      if (
        Engine.activeInstance.canvas === canvas &&
        Engine.activeInstance.boundaryWidth === boundaryWidth &&
        Engine.activeInstance.boundaryHeight === boundaryHeight
      ) {
        return Engine.activeInstance;
      }

      Engine.activeInstance.dispose();
    }

    Engine.activeInstance = new Engine(canvas, boundaryWidth, boundaryHeight, options);
    return Engine.activeInstance;
  }

  public static destroyInstance(): void {
    if (!Engine.activeInstance) {
      return;
    }

    Engine.activeInstance.dispose();
    Engine.activeInstance = null;
  }

  public addCircle(params: AddCircleParams): CircleObject {
    this.assertNotDisposed();

    const circle = createCircleObject(
      params.id ?? `circle-${Engine.nextCircleId++}`,
      new Vector2D(params.x, params.y),
      new Vector2D(params.velocityX ?? 0, params.velocityY ?? 0),
      params.radius,
    );

    if (params.mass !== undefined) {
      circle.mass = params.mass;
    }

    if (params.color) {
      circle.color = params.color;
    }

    this.world.addCircle(circle);
    this.renderOnceIfPaused();

    return circle;
  }

  public removeCircle(id: string): boolean {
    this.assertNotDisposed();

    const removed = this.world.removeCircle(id);

    if (removed) {
      this.renderOnceIfPaused();
    }

    return removed;
  }

  public reset(): void {
    this.assertNotDisposed();

    const circles = [...this.world.getCircles()];

    for (const circle of circles) {
      this.world.removeCircle(circle.id);
    }

    this.lastFrameTime = 0;
    this.renderOnceIfPaused();
  }

  public start(): void {
    this.assertNotDisposed();

    if (this.running) {
      return;
    }

    this.running = true;
    this.lastFrameTime = 0;
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public pause(): void {
    this.running = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.lastFrameTime = 0;
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getCircles(): readonly CircleObject[] {
    return this.world.getCircles();
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.pause();
    this.renderer.dispose();
    this.disposed = true;

    if (Engine.activeInstance === this) {
      Engine.activeInstance = null;
    }
  }

  private readonly loop = (time: number): void => {
    if (!this.running || this.disposed) {
      return;
    }

    const dt = this.calculateDeltaTime(time);

    if (dt > 0) {
      this.world.update(dt);
    }

    this.renderer.render(this.world.getCircles());
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private calculateDeltaTime(time: number): number {
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = time;
      return 0;
    }

    const dt = Math.min((time - this.lastFrameTime) / 1000, this.maxDeltaTime);
    this.lastFrameTime = time;

    return dt;
  }

  private renderOnce(): void {
    this.renderer.render(this.world.getCircles());
  }

  private renderOnceIfPaused(): void {
    if (!this.running) {
      this.renderOnce();
    }
  }

  private assertNotDisposed(): void {
    if (this.disposed) {
      throw new Error("Engine has been disposed.");
    }
  }
}
