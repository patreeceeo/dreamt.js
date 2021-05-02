import {Euler, Vector3} from 'three';
import {calculateEulerAngleBetweenPoints} from './index';

const PI = Math.PI;

test("calculateEulerAngleBetweenPoints", () => {
  const target = new Euler();
  const pointA = new Vector3(1, 0, 0);
  const pointB = new Vector3(0, 1, 0);

  calculateEulerAngleBetweenPoints(target, pointA, pointB);

  expect(target.x).toBeCloseTo(0);
  expect(target.y).toBeCloseTo(0);
  expect(target.z).toBeCloseTo(PI/4);

  pointA.set(0, 1, 0)
  pointB.set(0, 0, 1)


  calculateEulerAngleBetweenPoints(target, pointA, pointB);

  expect(target.x).toBeCloseTo(3*PI/4);
  expect(target.y).toBeCloseTo(0);
  expect(target.z).toBeCloseTo(0);

  pointA.set(1, 0, 0)
  pointB.set(0, 0, 0)

  calculateEulerAngleBetweenPoints(target, pointA, pointB);

  expect(target.x).toBeCloseTo(0);
  expect(target.y).toBeCloseTo(0);
  expect(target.z).toBeCloseTo(PI/2);
});
