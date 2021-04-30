import { apply3rdPersonView } from "./index";
import { Camera, Euler, Vector3 } from "three";

describe("apply3rdPersonView", () => {
  test("subtracts offset amount from given position", () => {
    const target = new Camera();
    const lookDirection = new Euler(0, 0, 0);
    const position = new Vector3(0, 0, 3);
    const expectedPosition = new Vector3(0, 0, -2);
    apply3rdPersonView(target, position, lookDirection, 5);
    expect(target.position).toEqual(expectedPosition);
  });

  test("rotates offset amount according to looking direction", () => {
    const target = new Camera();
    const lookDirection = new Euler(0, Math.PI/2, 0);
    const position = new Vector3(0, 0, 0);
    const expectedPosition = new Vector3(-5, 0, -0);
    apply3rdPersonView(target, position, lookDirection, 5);
    target.position.round();
    expect(target.position).toEqual(expectedPosition);
  });

  test("looks at position", () => {
    const target = new Camera();
    const lookDirection = new Euler(0, Math.PI/2, 0);
    const position = new Vector3(0, 0, 0);
    const expectedRotation = new Euler(0, -Math.PI/2, 0);
    apply3rdPersonView(target, position, lookDirection, 5);
    expect(target.rotation.toArray()).toEqual(expectedRotation.toArray());
  });
});
