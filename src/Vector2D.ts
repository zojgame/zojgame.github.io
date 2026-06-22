export class Vector2D {
  public x: number;
  public y: number;

  public constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  public add(other: Vector2D): Vector2D {
    return new Vector2D(this.x + other.x, this.y + other.y);
  }

  public subtract(other: Vector2D): Vector2D {
    return new Vector2D(this.x - other.x, this.y - other.y);
  }

  public multiplyScalar(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  public addInPlace(other: Vector2D): this {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  public subtractInPlace(other: Vector2D): this {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  public multiplyScalarInPlace(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  public dot(other: Vector2D): number {
    return this.x * other.x + this.y * other.y;
  }

  public magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  public magnitude(): number {
    return Math.sqrt(this.magnitudeSquared());
  }

  public normalize(): Vector2D {
    const length = this.magnitude();

    if (length === 0) {
      return new Vector2D(0, 0);
    }

    return new Vector2D(this.x / length, this.y / length);
  }
}
