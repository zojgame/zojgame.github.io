import { Vector2D } from "./Vector2D";

export interface CircleObject {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  radius: number;
  mass: number;
  color?: readonly [number, number, number, number];
}

export function createCircleObject(
  id: string,
  position: Vector2D,
  velocity: Vector2D,
  radius: number,
): CircleObject {
  return {
    id,
    position,
    velocity,
    radius,
    mass: radius * radius,
  };
}
