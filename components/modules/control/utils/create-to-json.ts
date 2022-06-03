export const createToJson = <T extends string | number | symbol>(...fields: T[]) => function toJSON(this: Record<T, any>) {
  return Object.fromEntries(
    fields.map(field => [field, this[field]])
  );
};
