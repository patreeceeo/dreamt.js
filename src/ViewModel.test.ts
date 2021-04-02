import { ViewModel } from "./ViewModel";

describe("ViewModel", () => {
  test("fromView/toSystem", () => {
    const sut = new ViewModel<{ name: string }>(() => ({ name: "" }));

    sut.fromView = { name: "wolverine" };

    expect(sut.toSystem).toEqual({ name: "wolverine" });
    expect(sut.isDirty).toBe(true);
  });

  test("fromSystem/toView", () => {
    const sut = new ViewModel<{ name: string }>(() => ({ name: "" }));

    sut.fromSystem = { name: "wolverine" };

    expect(sut.toView).toEqual({ name: "wolverine" });
  });

  test("clean", () => {
    const sut = new ViewModel<{ name: string }>(() => ({ name: "" }));

    sut.fromView = { name: "wolverine" };
    sut.clean()

    expect(sut.isDirty).toBe(false);
    expect(sut.toSystem).toBe(sut.toView);
    expect(sut.toSystem).toEqual({name: ""});
  });

  test("fromViewPartial", () => {
    const sut = new ViewModel<{ name: string }>(() => ({ name: "", age: 40 }));

    sut.fromViewPartial = { name: "wolverine" };
    expect(sut.toSystem).toEqual({ name: "wolverine", age: 40 });
    expect(sut.isDirty).toBe(true);
  });
});
