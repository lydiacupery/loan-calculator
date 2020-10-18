export type Port<S extends string = string, T = any> = {
  key: S;
  _type: T;
};

export type PortType<TP extends Port> = TP["_type"];
