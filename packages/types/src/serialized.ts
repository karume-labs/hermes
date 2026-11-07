/**
 * Drizzle returns `Date` objects; JSON responses carry ISO strings. Shared DTOs
 * describe what actually crosses the wire, so dates are rewritten to strings
 * while every other column type stays exactly as the schema declares it.
 */
export type Serialized<T> = T extends Date
  ? string
  : T extends readonly (infer Item)[]
    ? Serialized<Item>[]
    : T extends object
      ? { [Key in keyof T]: Serialized<T[Key]> }
      : T;
