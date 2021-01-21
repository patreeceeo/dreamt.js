import {RenderState} from './RenderState';
import * as ECSY from 'ecsy';

describe("RenderState", () => {
  test("mapEntities", () => {
    const sut = new RenderState();

    class ComponentA extends ECSY.Component<any> {}
    class ComponentB extends ECSY.Component<any> {}

    const e1 = new ECSY.Entity().addComponent(ComponentA).addComponent(ComponentB);
    const e2 = new ECSY.Entity().addComponent(ComponentA);
    const e3 = new ECSY.Entity().addComponent(ComponentB);
    const e4 = new ECSY.Entity();

    sut.entities.add(e1);
    sut.entities.add(e2);
    sut.entities.add(e3);
    sut.entities.add(e4);

    const spyA = jest.fn((x) => x);
    const spyB = jest.fn((x) => x);

    const resA = sut.mapEntities(spyA, {withComponent: ComponentA});
    const resB = sut.mapEntities(spyB, {withComponent: ComponentB});

    expect(spyA).toHaveBeenCalledTimes(2);
    expect(spyB).toHaveBeenCalledTimes(2);

    expect(spyA).toHaveBeenCalledWith(e1, expect.any(ComponentA));
    expect(spyA).toHaveBeenCalledWith(e2, expect.any(ComponentA));

    expect(spyB).toHaveBeenCalledWith(e1, expect.any(ComponentB));
    expect(spyB).toHaveBeenCalledWith(e3, expect.any(ComponentB));

    expect(resA).toEqual([e1, e2]);
    expect(resB).toEqual([e1, e3]);
  });
});
