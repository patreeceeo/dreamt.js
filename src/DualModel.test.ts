import { DualModel } from "./DualModel";
import { asyncActivity } from "./testUtils";

describe("DualModel", () => {
  test("setRequest/request", async () => {
    const sut = new DualModel<{ name: string }>(() => ({ name: "" }), {
      debounceRequestMs: 200,
    });

    sut.setRequest({ name: "wolverine" });

    expect(sut.request).toEqual({ name: "" });
    expect(sut.isDirty).toBe(false);

    // Jest's fake timers don't work with debounce for some reason
    await asyncActivity(200);

    expect(sut.request).toEqual({ name: "wolverine" });
    expect(sut.isDirty).toBe(true);
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
