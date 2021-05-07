import { Euler, Vector3 } from "three";
import { calculateEulerBetweenPoints, intersectLineWithPlane } from "./index";

const PI = Math.PI;

test("calculateEulerBetweenPoints", () => {
  let result: Euler;
  const pointA = new Vector3(1, 0, 0);
  const pointB = new Vector3(0, 1, 0);

  result = calculateEulerBetweenPoints(pointA, pointB);

  expect(result.x).toBeCloseTo(0);
  expect(result.y).toBeCloseTo(0);
  expect(result.z).toBeCloseTo(PI / 4);

  pointA.set(0, 1, 0);
  pointB.set(0, 0, 1);

  result = calculateEulerBetweenPoints(pointA, pointB);

  expect(result.x).toBeCloseTo((3 * PI) / 4);
  expect(result.y).toBeCloseTo(0);
  expect(result.z).toBeCloseTo(0);

  pointA.set(1, 0, 0);
  pointB.set(0, 0, 0);

  result = calculateEulerBetweenPoints(pointA, pointB);

  expect(result.x).toBeCloseTo(0);
  expect(result.y).toBeCloseTo(0);
  expect(result.z).toBeCloseTo(PI / 2);

  pointA.set(0, 0, 0);
  pointB.set(0, 1, 0);

  result = calculateEulerBetweenPoints(pointA, pointB);

  expect(result.x).toBeCloseTo(0);
  expect(result.y).toBeCloseTo(0);
  expect(result.z).toBeCloseTo(0);
});

test("intersectLineWithPlane", () => {
  let result: Vector3 | null;

  result = intersectLineWithPlane(
    new Vector3(0, 0, 0),
    new Vector3(2, 0, 0),
    new Vector3(-1, 0, 0),
    0.5
  );

  expect(result!.x).toBe(0.5);
  expect(result!.y).toBe(0);
  expect(result!.z).toBe(0);

  result = intersectLineWithPlane(
    new Vector3(0, 0, 0),
    new Vector3(0, 2, 0),
    new Vector3(0, -1, 0),
    0.5
  );

  expect(result!.x).toBe(0);
  expect(result!.y).toBe(0.5);
  expect(result!.z).toBe(0);

  result = intersectLineWithPlane(
    new Vector3(0, 0, 0),
    new Vector3(0, -2, 0),
    new Vector3(0, -1, 0),
    -0.5
  );

  expect(result!.x).toBe(0);
  expect(result!.y).toBe(-0.5);
  expect(result!.z).toBe(0);

  result = intersectLineWithPlane(
    new Vector3(2, 0, 0),
    new Vector3(0, 2, 0),
    new Vector3(0, -1, 0),
    0.5
  );

  expect(result!.x).toBe(1.5);
  expect(result!.y).toBe(0.5);
  expect(result!.z).toBe(0);
});
