import { DualModel } from "./DualModel";
import { asyncActivity } from "./testUtils";

describe("DualModel", () => {
  test("setRequest/request", async () => {
    const sut = new DualModel<{ name: string }>(() => ({ name: "" }), {
      debounceRequestMs: 200,
    });
    spyOn(sut, "setDirty")

    sut.setRequest({ name: "wolverine" });

    expect(sut.request).toEqual({ name: "" });
    expect(sut.setDirty).not.toHaveBeenCalledTimes(1)

    // Jest's fake timers don't work with debounce for some reason
    await asyncActivity(200);

    expect(sut.request).toEqual({ name: "wolverine" });
    expect(sut.setDirty).toHaveBeenCalledTimes(1)
  });

  test("setActual/actual", () => {
    const sut = new DualModel<{ name: string }>(() => ({ name: "" }));

    sut.setActual({ name: "wolverine" });

    expect(sut.actual).toEqual({ name: "wolverine" });
  });

  test("clean", () => {
    const sut = new DualModel<{ name: string }>(() => ({ name: "" }));

    sut.setRequest({ name: "wolverine" });
    sut.clean();

    expect(sut.isDirty).toBe(false);
    expect(sut.request).toBe(sut.actual);
    expect(sut.request).toEqual({ name: "" });
  });

  test("setDirty", () => {
    const sut = new DualModel<{ name: string }>(() => ({ name: "" }));

    sut.setDirty();

    expect(sut.isDirty).toBe(true);
  });

  test("setRequestPart", async () => {
    const sut = new DualModel<{ name: string }>(() => ({ name: "", age: 40 }), {
      debounceRequestMs: 200,
    });

    sut.setRequestPart({ name: "wolverine" });

    expect(sut.request).toEqual({ name: "", age: 40 });
    expect(sut.isDirty).toBe(false);

    // Jest's fake timers don't work with debounce for some reason
    await asyncActivity(200);

    expect(sut.request).toEqual({ name: "wolverine", age: 40 });
    expect(sut.isDirty).toBe(true);
  });
});
