import { apply3rdPersonView } from "./index";
import { Camera, Euler, Vector3 } from "three";

describe("apply3rdPersonView", () => {
  test("subtracts offset amount from given position", () => {
    const target = new Camera();
    // Looking straight forward
    const lookDirection = new Euler(0, 0, 0);
    const position = new Vector3(0, 0, 3);
    const expectedPosition = new Vector3(0, 0, -2);
    apply3rdPersonView(target, position, lookDirection, 5, 3);
    expect(target.position).toEqual(expectedPosition);
  });

  test("rotates offset amount according to looking direction", () => {
    const target = new Camera();
    // Looking left
    const lookDirection = new Euler(0, Math.PI/2, 0);
    const position = new Vector3(0, 0, 0);
    const expectedPosition = new Vector3(-5, 0, -0);
    apply3rdPersonView(target, position, lookDirection, 5, 3);
    target.position.round();
    expect(target.position).toEqual(expectedPosition);
  });

  test("looks at position", () => {
    const target = new Camera();
    const lookDirection = new Euler(0, Math.PI/2, 0);
    const position = new Vector3(0, 0, 0);
    const expectedRotation = new Euler(0, -Math.PI/2, 0);
    apply3rdPersonView(target, position, lookDirection, 5, 3);
    expect(target.rotation.toArray()).toEqual(expectedRotation.toArray());
  });

  test("keeps camera above ground", () => {
    const target = new Camera();
    const xRot = -Math.PI / 4;
    const setback = 7;
    const elevation = 3;
    const groundIntersection = elevation / Math.tan(xRot);
    const lookDirection = new Euler(xRot, 0, 0);
    const position = new Vector3(0, elevation, 0);
    apply3rdPersonView(target, position, lookDirection, setback, elevation);
    expect(target.position.x).toBeCloseTo(0)
    expect(target.position.y).toBeCloseTo(0)
    expect(target.position.z).toBeCloseTo(groundIntersection)
  });

  test("keeps camera from getting too close", () => {
    const target = new Camera();
    const xRot = -Math.PI / 2;
    const setback = 7;
    const elevation = 1;
    const bodyCylinderRadius = 1;
    const lookDirection = new Euler(xRot, 0, 0);
    const position = new Vector3(0, 0, 0);
    apply3rdPersonView(target, position, lookDirection, setback, elevation, bodyCylinderRadius);
    expect(target.position.z).toBeCloseTo(- bodyCylinderRadius)
  });

  test("camera always looks in same direction as player", () => {
    const target = new Camera();
    const xRot = -Math.PI / 2;
    const setback = 7;
    const elevation = 1;
    const bodyCylinderRadius = 1;
    const lookDirection = new Euler(xRot, 0, 0);
    const position = new Vector3(0, 0, 0);
    apply3rdPersonView(target, position, lookDirection, setback, elevation, bodyCylinderRadius);
    expect(target.rotation.x).toBeCloseTo(-lookDirection.x)
  });
});
