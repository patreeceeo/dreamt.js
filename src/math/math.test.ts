import {Euler, Vector3} from 'three';
import {calculateEulerBetweenPoints} from './index';

const PI = Math.PI;

test("calculateEulerBetweenPoints", () => {
  let result: Euler;
  const pointA = new Vector3(1, 0, 0);
  const pointB = new Vector3(0, 1, 0);

  result = calculateEulerBetweenPoints(pointA, pointB);

  expect(result.x).toBeCloseTo(0);
  expect(result.y).toBeCloseTo(0);
  expect(result.z).toBeCloseTo(PI/4);

  pointA.set(0, 1, 0)
  pointB.set(0, 0, 1)


  result = calculateEulerBetweenPoints(pointA, pointB);

  expect(result.x).toBeCloseTo(3*PI/4);
  expect(result.y).toBeCloseTo(0);
  expect(result.z).toBeCloseTo(0);

  pointA.set(1, 0, 0)
  pointB.set(0, 0, 0)

  result = calculateEulerBetweenPoints(pointA, pointB);

  expect(result.x).toBeCloseTo(0);
  expect(result.y).toBeCloseTo(0);
  expect(result.z).toBeCloseTo(PI/2);
});