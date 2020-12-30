import { Component, Types } from "ecsy";

/**
 * Rotation of entity in three dimensions.
 */
class Rotation3D extends Component<number[]> {}
Rotation3D.schema = {
  value: { type: Types.Array },
};

export default Rotation3D;
