import { EntityRenderConnector } from "./EntityRenderConnector";
import type { RenderState } from "./RenderState";
import * as React from "react";
import ReactDOM from "react-dom";
import * as ECSY from "ecsy";
import * as TUT from "../testUtils";
import { observer } from "mobx-react-lite";

class ListItemComponent extends ECSY.Component<{ value: string }> {
  static schema = {
    value: { type: ECSY.Types.String },
  };
}

describe("EntityRenderConnector", () => {
  let sut: EntityRenderConnector;
  let worldMock: ECSY.World;
  let attributes: any;
  beforeEach(() => {
    worldMock = new ECSY.World();

    const ReactApp: React.FunctionComponent<{ observables: RenderState }> = ({
      observables,
    }) => {
      const entities = Array.from(observables.entities);
      return (
        <ul>
          {entities.map((e) => {
            const c = e.getComponent(TUT.cast(ListItemComponent));
            const value = TUT.cast<{value: string}>(c).value;
            return <li key={value}>{value}</li>;
          })}
        </ul>
      );
    };

    const renderToDom = (observableState: RenderState) => {
      const Observer = observer(ReactApp);
      ReactDOM.render(
        <Observer observables={observableState} />,
        document.getElementById("react-app")
      );
    };

    attributes = {
      renderToDom,
      components: {
        ListItemComponent,
      },
    };

    sut = new EntityRenderConnector(
      TUT.cast<ECSY.World>(worldMock),
      TUT.cast(attributes)
    );
  });

  it("returns an instantiated extension of ECSY.System", () => {
    expect(worldMock.registerSystem).toHaveBeenCalledWith(
      sut.RenderSystem,
      attributes
    );
    expect(sut.RenderSystem.queries.ListItemComponent).toBeDefined();
  });

  test("using React", async () => {
    const rootEl = document.createElement("div");
    rootEl.setAttribute("id", "react-app");
    document.body.append(rootEl);

    // Using mocked ECSY, so the test code must emulate the real ECSY
    // implementation
    const system = new sut.RenderSystem(worldMock);
    system.init();

    let results: ECSY.Entity[] = [];
    system.queries = {
      ListItemComponent: {
        added: results,
        removed: [],
        changed: [],
        results,
      },
    };
    system.execute(0, 0);

    await TUT.asyncActivity();

    expect(rootEl.firstElementChild?.tagName).toBe("UL");

    // Entities added
    const e1 = new ECSY.Entity().addComponent(ListItemComponent, {
      value: "hi",
    });
    const e2 = new ECSY.Entity().addComponent(ListItemComponent, {
      value: "bye",
    });
    results = [e1, e2];
    system.queries = {
      ListItemComponent: {
        added: results,
        removed: [],
        changed: [],
        results,
      },
    };
    system.execute(0, 0);

    await TUT.asyncActivity();

    expect(rootEl.firstElementChild?.children.item(0)?.tagName).toBe("LI");
    expect(rootEl.firstElementChild?.children.item(0)?.textContent).toBe("hi");
    expect(rootEl.firstElementChild?.children.item(1)?.textContent).toBe("bye");
  });
});
