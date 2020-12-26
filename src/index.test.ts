import { Example } from "./index";

describe("Example", () => {
  it("eximplifies", () => {
    const e = new Example();
    expect(e.exampleMethod("yayah")).toBe("yayah");
  });
});
