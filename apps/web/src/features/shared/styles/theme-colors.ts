import type { MantineColorsTuple } from "@mantine/core";

/* Ink — Rich Slate. Text, tiles, headers. */
export const ink: MantineColorsTuple = [
  "#f8fafc",
  "#f1f5f9",
  "#e2e8f0",
  "#cbd5e1",
  "#94a3b8",
  "#64748b",
  "#475569",
  "#334155",
  "#1e293b",
  "#0f172a",
];

/* Cerulean — secondary accent. Text, icons and lines only; shade 9 is the
 * darkened text variant that clears 4.5:1 on light surfaces. */
export const cerulean: MantineColorsTuple = [
  "#eef8fd",
  "#d9f0fb",
  "#b3e2f6",
  "#8bd3f0",
  "#67c6eb",
  "#55bfe9",
  "#4bb8e7",
  "#3aa9d6",
  "#2c93bc",
  "#22739b",
];

/* Blaze Orange — primary actions, focus, indicators. Labels use ink, never
 * white, so shade 6 (5.8:1 against ink) is the filled default. */
export const blaze: MantineColorsTuple = [
  "#fff2eb",
  "#ffe1d1",
  "#ffc6ab",
  "#ffa578",
  "#ff8447",
  "#ff6a1a",
  "#ff5500",
  "#e64c00",
  "#cc4400",
  "#b33b00",
];

/* Status pairs. Deliberately separate from spark so urgent never reads as a
 * primary button. Shade 0 is the fill, shade 6 the text. */
export const routine: MantineColorsTuple = [
  "#dcfce7",
  "#c9f7d8",
  "#a7efc0",
  "#7ee3a3",
  "#4fd183",
  "#22b463",
  "#166534",
  "#14532d",
  "#0f4425",
  "#0a351d",
];

export const actionable: MantineColorsTuple = [
  "#fef3c7",
  "#fde9a8",
  "#fbd97a",
  "#f6c24a",
  "#eda92a",
  "#d18b13",
  "#92400e",
  "#7c360c",
  "#682d0a",
  "#542408",
];

export const urgent: MantineColorsTuple = [
  "#fee2e2",
  "#fccfcf",
  "#f8adad",
  "#f18484",
  "#e85f5f",
  "#d93b3b",
  "#991b1b",
  "#841717",
  "#701313",
  "#5c1010",
];

export const info: MantineColorsTuple = [
  "#e0f2fe",
  "#c8e8fd",
  "#9bd6fa",
  "#6cc3f4",
  "#42afec",
  "#2196d8",
  "#075985",
  "#064c72",
  "#053f5f",
  "#04324c",
];
