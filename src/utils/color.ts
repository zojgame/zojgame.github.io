export function hexToRgba(hex: string): readonly [number, number, number, number] {
  const normalized = hex.replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return [0.2, 0.75, 1, 1];
  }

  const red = parseInt(normalized.slice(0, 2), 16) / 255;
  const green = parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = parseInt(normalized.slice(4, 6), 16) / 255;

  return [red, green, blue, 1];
}
