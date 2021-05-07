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
    const expectedRotation = new Euler(0, -Math.PI/2, 0,);
    apply3rdPersonView(target, position, lookDirection, 5, 3);
    expect(target.rotation.toArray()).toEqual(expectedRotation.toArray());
  });

  test("keeps camera above ground", () => {
    const target = new Camera();
    const xRot = -Math.atan(0.5);
    const setback = 7;
    const elevation = 3;
    const groundIntersection = elevation / Math.tan(xRot);
    const lookDirection = new Euler(xRot, 0, 0);
    const position = new Vector3(0, 0, 0);
    apply3rdPersonView(target, position, lookDirection, setback, elevation);
    expect(target.position.x).toBeCloseTo(0)
    expect(target.position.y).toBeCloseTo(- elevation)
    expect(target.position.z).toBeCloseTo(groundIntersection)
  });
});
