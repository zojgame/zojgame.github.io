import { CircleObject } from "./CircleObject";
import { Vector2D } from "./Vector2D";

export class PhysicsWorld {
  private static readonly PENETRATION_SLOP = 0.001;

  private readonly circles: CircleObject[] = [];
  private readonly width: number;
  private readonly height: number;

  public constructor(width: number, height: number) {
    if (width <= 0 || height <= 0) {
      throw new Error("PhysicsWorld dimensions must be greater than zero.");
    }

    this.width = width;
    this.height = height;
  }

  public addCircle(circle: CircleObject): void {
    this.validateCircle(circle);
    this.circles.push(circle);
  }

  public removeCircle(id: string): boolean {
    const index = this.circles.findIndex((circle) => circle.id === id);

    if (index === -1) {
      return false;
    }

    this.circles.splice(index, 1);
    return true;
  }

  public getCircles(): readonly CircleObject[] {
    return this.circles;
  }

  public update(dt: number): void {
    if (dt < 0) {
      throw new Error("PhysicsWorld.update dt must be non-negative.");
    }

    for (const circle of this.circles) {
      this.integrate(circle, dt);
      this.resolveBoundaryCollision(circle);
    }

    this.resolveCircleCollisions();
  }

  private integrate(circle: CircleObject, dt: number): void {
    circle.position.x += circle.velocity.x * dt;
    circle.position.y += circle.velocity.y * dt;
  }

  private resolveBoundaryCollision(circle: CircleObject): void {
    let x = circle.position.x;
    let y = circle.position.y;
    let velocityX = circle.velocity.x;
    let velocityY = circle.velocity.y;

    if (x - circle.radius < 0) {
      x = circle.radius + PhysicsWorld.PENETRATION_SLOP;
      velocityX = Math.abs(velocityX);
    } else if (x + circle.radius > this.width) {
      x = this.width - circle.radius - PhysicsWorld.PENETRATION_SLOP;
      velocityX = -Math.abs(velocityX);
    }

    if (y - circle.radius < 0) {
      y = circle.radius + PhysicsWorld.PENETRATION_SLOP;
      velocityY = Math.abs(velocityY);
    } else if (y + circle.radius > this.height) {
      y = this.height - circle.radius - PhysicsWorld.PENETRATION_SLOP;
      velocityY = -Math.abs(velocityY);
    }

    circle.position.x = x;
    circle.position.y = y;
    circle.velocity.x = velocityX;
    circle.velocity.y = velocityY;
  }

  private resolveCircleCollisions(): void {
    for (let i = 0; i < this.circles.length - 1; i += 1) {
      for (let j = i + 1; j < this.circles.length; j += 1) {
        this.resolveCircleCollision(this.circles[i], this.circles[j]);
      }
    }
  }

  private resolveCircleCollision(a: CircleObject, b: CircleObject): void {
    const deltaX = b.position.x - a.position.x;
    const deltaY = b.position.y - a.position.y;
    const minDistance = a.radius + b.radius;
    const distanceSquared = deltaX * deltaX + deltaY * deltaY;

    if (distanceSquared >= minDistance * minDistance) {
      return;
    }

    const distance = Math.sqrt(distanceSquared);
    const normal =
      distance > 0 ? new Vector2D(deltaX / distance, deltaY / distance) : new Vector2D(1, 0);
    const penetration = minDistance - distance;

    this.resolvePenetration(a, b, normal, penetration);
    this.resolveElasticVelocity(a, b, normal);
  }

  private resolvePenetration(
    a: CircleObject,
    b: CircleObject,
    normal: Vector2D,
    penetration: number,
  ): void {
    const totalInverseMass = 1 / a.mass + 1 / b.mass;

    if (totalInverseMass === 0) {
      return;
    }

    const correctionMagnitude =
      Math.max(penetration - PhysicsWorld.PENETRATION_SLOP, 0) / totalInverseMass;
    const correctionX = normal.x * correctionMagnitude;
    const correctionY = normal.y * correctionMagnitude;
    const inverseMassA = 1 / a.mass;
    const inverseMassB = 1 / b.mass;

    a.position.x -= correctionX * inverseMassA;
    a.position.y -= correctionY * inverseMassA;
    b.position.x += correctionX * inverseMassB;
    b.position.y += correctionY * inverseMassB;
  }

  private resolveElasticVelocity(a: CircleObject, b: CircleObject, normal: Vector2D): void {
    const relativeVelocityX = b.velocity.x - a.velocity.x;
    const relativeVelocityY = b.velocity.y - a.velocity.y;
    const velocityAlongNormal = relativeVelocityX * normal.x + relativeVelocityY * normal.y;

    if (velocityAlongNormal > 0) {
      return;
    }

    const restitution = 1;
    const impulseMagnitude =
      (-(1 + restitution) * velocityAlongNormal) / (1 / a.mass + 1 / b.mass);
    const impulseX = normal.x * impulseMagnitude;
    const impulseY = normal.y * impulseMagnitude;
    const inverseMassA = 1 / a.mass;
    const inverseMassB = 1 / b.mass;

    a.velocity.x -= impulseX * inverseMassA;
    a.velocity.y -= impulseY * inverseMassA;
    b.velocity.x += impulseX * inverseMassB;
    b.velocity.y += impulseY * inverseMassB;
  }

  private validateCircle(circle: CircleObject): void {
    if (circle.radius <= 0) {
      throw new Error(`Circle "${circle.id}" radius must be greater than zero.`);
    }

    if (circle.mass <= 0) {
      throw new Error(`Circle "${circle.id}" mass must be greater than zero.`);
    }
  }
}
