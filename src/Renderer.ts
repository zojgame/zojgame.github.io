import { CircleObject } from "./CircleObject";

const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aUnitQuadPosition;
layout(location = 1) in vec3 aCircle;
layout(location = 2) in vec4 aCircleColor;

uniform vec2 uWorldSize;

out vec2 vLocalPosition;
out float vRadius;
out vec4 vCircleColor;

void main() {
  vec2 worldPosition = aCircle.xy + aUnitQuadPosition * aCircle.z;
  vec2 clipPosition = (worldPosition / uWorldSize) * 2.0 - 1.0;

  gl_Position = vec4(clipPosition * vec2(1.0, -1.0), 0.0, 1.0);
  vLocalPosition = aUnitQuadPosition * aCircle.z;
  vRadius = aCircle.z;
  vCircleColor = aCircleColor;
}
`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 vLocalPosition;
in float vRadius;
in vec4 vCircleColor;

out vec4 outColor;

void main() {
  float signedDistance = length(vLocalPosition) - vRadius;
  float edgeWidth = max(fwidth(signedDistance), 0.0001);
  float alpha = 1.0 - smoothstep(-edgeWidth, edgeWidth, signedDistance);

  if (alpha <= 0.0) {
    discard;
  }

  outColor = vec4(vCircleColor.rgb, vCircleColor.a * alpha);
}
`;

export interface RendererOptions {
  backgroundColor?: readonly [number, number, number, number];
  circleColor?: readonly [number, number, number, number];
  devicePixelRatio?: number;
}

export class Renderer {
  private static readonly FLOATS_PER_CIRCLE = 7;
  private static readonly DEFAULT_CIRCLE_COLOR: readonly [number, number, number, number] = [
    0.2, 0.75, 1, 1,
  ];

  private readonly canvas: HTMLCanvasElement;
  private readonly worldWidth: number;
  private readonly worldHeight: number;
  private readonly backgroundColor: readonly [number, number, number, number];
  private readonly fixedDevicePixelRatio: number | null;

  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vertexArray: WebGLVertexArrayObject | null = null;
  private quadBuffer: WebGLBuffer | null = null;
  private instanceBuffer: WebGLBuffer | null = null;
  private worldSizeUniform: WebGLUniformLocation | null = null;
  private instanceData = new Float32Array(0);
  private instanceCapacity = 0;

  public constructor(
    canvas: HTMLCanvasElement,
    boundaryWidth: number,
    boundaryHeight: number,
    options: RendererOptions = {},
  ) {
    if (boundaryWidth <= 0 || boundaryHeight <= 0) {
      throw new Error("Renderer boundary dimensions must be greater than zero.");
    }

    this.canvas = canvas;
    this.worldWidth = boundaryWidth;
    this.worldHeight = boundaryHeight;
    this.backgroundColor = options.backgroundColor ?? [0.04, 0.05, 0.07, 1];
    this.fixedDevicePixelRatio = options.devicePixelRatio ?? null;
  }

  public init(): void {
    const gl = this.canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
    });

    if (!gl) {
      throw new Error("WebGL2 is not supported by this browser or device.");
    }

    const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    const program = this.createProgram(gl, vertexShader, fragmentShader);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    const vertexArray = gl.createVertexArray();
    const quadBuffer = gl.createBuffer();
    const instanceBuffer = gl.createBuffer();

    if (!vertexArray || !quadBuffer || !instanceBuffer) {
      throw new Error("Failed to allocate WebGL buffers.");
    }

    this.gl = gl;
    this.program = program;
    this.vertexArray = vertexArray;
    this.quadBuffer = quadBuffer;
    this.instanceBuffer = instanceBuffer;
    this.worldSizeUniform = gl.getUniformLocation(program, "uWorldSize");

    this.canvas.style.display = "block";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";

    this.configureState();
    this.configureBuffers();
    this.resize();
  }

  public render(circles: readonly CircleObject[]): void {
    const gl = this.requireContext();
    const program = this.requireProgram();
    const vertexArray = this.requireVertexArray();

    this.resize();
    this.updateInstanceData(circles);

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(
      this.backgroundColor[0],
      this.backgroundColor[1],
      this.backgroundColor[2],
      this.backgroundColor[3],
    );
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (circles.length === 0) {
      return;
    }

    gl.useProgram(program);
    gl.bindVertexArray(vertexArray);
    gl.uniform2f(this.worldSizeUniform, this.worldWidth, this.worldHeight);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, circles.length);
    gl.bindVertexArray(null);
  }

  public resize(): void {
    const gl = this.requireContext();
    const devicePixelRatio = this.fixedDevicePixelRatio ?? window.devicePixelRatio ?? 1;
    const width = Math.max(1, Math.floor(this.canvas.clientWidth * devicePixelRatio));
    const height = Math.max(1, Math.floor(this.canvas.clientHeight * devicePixelRatio));

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  public dispose(): void {
    const gl = this.gl;

    if (!gl) {
      return;
    }

    if (this.instanceBuffer) {
      gl.deleteBuffer(this.instanceBuffer);
    }

    if (this.quadBuffer) {
      gl.deleteBuffer(this.quadBuffer);
    }

    if (this.vertexArray) {
      gl.deleteVertexArray(this.vertexArray);
    }

    if (this.program) {
      gl.deleteProgram(this.program);
    }

    this.gl = null;
    this.program = null;
    this.vertexArray = null;
    this.quadBuffer = null;
    this.instanceBuffer = null;
  }

  private configureState(): void {
    const gl = this.requireContext();

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  private configureBuffers(): void {
    const gl = this.requireContext();
    const vertexArray = this.requireVertexArray();

    gl.bindVertexArray(vertexArray);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 0, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(
      1,
      3,
      gl.FLOAT,
      false,
      Renderer.FLOATS_PER_CIRCLE * Float32Array.BYTES_PER_ELEMENT,
      0,
    );
    gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(
      2,
      4,
      gl.FLOAT,
      false,
      Renderer.FLOATS_PER_CIRCLE * Float32Array.BYTES_PER_ELEMENT,
      3 * Float32Array.BYTES_PER_ELEMENT,
    );
    gl.vertexAttribDivisor(2, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  private updateInstanceData(circles: readonly CircleObject[]): void {
    const gl = this.requireContext();
    const requiredLength = circles.length * Renderer.FLOATS_PER_CIRCLE;

    if (this.instanceData.length < requiredLength) {
      this.instanceData = new Float32Array(this.nextPowerOfTwo(requiredLength));
    }

    for (let i = 0; i < circles.length; i += 1) {
      const offset = i * Renderer.FLOATS_PER_CIRCLE;
      const circle = circles[i];
      const color = circle.color ?? Renderer.DEFAULT_CIRCLE_COLOR;

      this.instanceData[offset] = circle.position.x;
      this.instanceData[offset + 1] = circle.position.y;
      this.instanceData[offset + 2] = circle.radius;
      this.instanceData[offset + 3] = color[0];
      this.instanceData[offset + 4] = color[1];
      this.instanceData[offset + 5] = color[2];
      this.instanceData[offset + 6] = color[3];
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);

    if (this.instanceCapacity < requiredLength) {
      this.instanceCapacity = this.instanceData.length;
      gl.bufferData(
        gl.ARRAY_BUFFER,
        this.instanceCapacity * Float32Array.BYTES_PER_ELEMENT,
        gl.DYNAMIC_DRAW,
      );
    }

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.instanceData, 0, requiredLength);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  private createShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string,
  ): WebGLShader {
    const shader = gl.createShader(type);

    if (!shader) {
      throw new Error("Failed to create WebGL shader.");
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const infoLog = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error.";
      gl.deleteShader(shader);
      throw new Error(infoLog);
    }

    return shader;
  }

  private createProgram(
    gl: WebGL2RenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
  ): WebGLProgram {
    const program = gl.createProgram();

    if (!program) {
      throw new Error("Failed to create WebGL program.");
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const infoLog = gl.getProgramInfoLog(program) ?? "Unknown shader link error.";
      gl.deleteProgram(program);
      throw new Error(infoLog);
    }

    return program;
  }

  private nextPowerOfTwo(value: number): number {
    let result = 1;

    while (result < value) {
      result *= 2;
    }

    return result;
  }

  private requireContext(): WebGL2RenderingContext {
    if (!this.gl) {
      throw new Error("Renderer.init() must be called before using the renderer.");
    }

    return this.gl;
  }

  private requireProgram(): WebGLProgram {
    if (!this.program) {
      throw new Error("Renderer.init() must be called before rendering.");
    }

    return this.program;
  }

  private requireVertexArray(): WebGLVertexArrayObject {
    if (!this.vertexArray) {
      throw new Error("Renderer.init() must be called before rendering.");
    }

    return this.vertexArray;
  }
}

export { FRAGMENT_SHADER_SOURCE, VERTEX_SHADER_SOURCE };
