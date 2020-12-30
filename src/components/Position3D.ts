import { Component, Types } from "ecsy";

/**
 * Position of entity in three dimensions.
 */
class Position3D extends Component<number[]> {}
Position3D.schema = {
  value: { type: Types.Array },
};

export default Position3D;
