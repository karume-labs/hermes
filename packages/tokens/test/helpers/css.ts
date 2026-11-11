import { readFileSync } from "node:fs";
import { join } from "node:path";

const repo = join(import.meta.dir, "../../../..");

export const read = (path: string): string =>
  readFileSync(join(repo, path), "utf8");

/** Balanced-brace extraction so nested @layer blocks still parse. */
export const block = (css: string, selector: string): string => {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`Missing selector: ${selector}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, index);
    }
  }
  throw new Error(`Unbalanced block: ${selector}`);
};

export const variables = (
  css: string,
  selector: string,
): Record<string, string> =>
  Object.fromEntries(
    [...block(css, selector).matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(
      (match) => [match[1], match[2].trim()],
    ),
  );

export const cssVar = (
  variables: Record<string, string>,
  name: string,
): string => {
  const value = variables[name];
  if (value === undefined) throw new Error(`Missing variable: ${name}`);
  return value;
};
