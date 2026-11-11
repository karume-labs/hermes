import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const LINE_LIMIT = 150;
const IGNORED = [
  "node_modules",
  ".next",
  ".astro",
  ".expo",
  "dist",
  "build",
  "migrations",
];
const ENV_MODULES = ["env/", "scripts/"];
const FRAMEWORK_DEFAULT_EXPORT = ["/app/", ".config."];
const DOUBLE_CAST = /\bas\s+unknown\s+as\b/;

const legacy: string[] = JSON.parse(
  await readFile("scripts/guardrails-legacy.json", "utf8"),
);

interface Violation {
  file: string;
  line: number;
  rule: string;
  message: string;
}

const isIgnored = (file: string): boolean =>
  file.split("/").some((segment) => IGNORED.includes(segment));

const listFiles = (): string[] =>
  execFileSync("git", ["ls-files", "*.ts", "*.tsx"], { encoding: "utf8" })
    .split("\n")
    .filter((file) => file.length > 0 && !isIgnored(file));

const checkFile = (file: string, source: string): Violation[] => {
  const violations: Violation[] = [];
  const lines = source.replace(/\n$/, "").split("\n");
  const name = file.split("/").pop() ?? file;
  const envAllowed = ENV_MODULES.some((part) => file.includes(part));
  const defaultAllowed = FRAMEWORK_DEFAULT_EXPORT.some((part) =>
    file.includes(part),
  );
  const add = (line: number, rule: string, message: string): void => {
    violations.push({ file, line, rule, message });
  };

  if (name !== name.toLowerCase()) {
    add(1, "naming", `"${name}" must be kebab-case`);
  }
  if (lines.length > LINE_LIMIT && !legacy.includes(file)) {
    add(1, "size", `${lines.length} lines exceeds the ${LINE_LIMIT}-line cap`);
  }
  if (DOUBLE_CAST.test(source)) {
    add(1, "fallbacks", "double cast is banned");
  }

  lines.forEach((line, index) => {
    const isComment = /^\s*(\/\/|\*|\/\*)/.test(line);
    if (
      /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+\w/.test(line)
    ) {
      add(index + 1, "general", "use an arrow function, not a declaration");
    }
    if (/=\s*function\b/.test(line)) {
      add(index + 1, "general", "use an arrow function, not an expression");
    }
    if (!envAllowed && /\bprocess\.env\b/.test(line) && !isComment) {
      add(index + 1, "env", "read the validated env object instead");
    }
    if (!defaultAllowed && /^\s*export\s+default\b/.test(line)) {
      add(
        index + 1,
        "general",
        "use a named export; default is framework-only",
      );
    }
  });

  return violations;
};

const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const files =
  args.length > 0
    ? args.filter((file) => /\.(ts|tsx)$/.test(file) && !isIgnored(file))
    : listFiles();
const results = (
  await Promise.all(
    files.map(async (file) => checkFile(file, await readFile(file, "utf8"))),
  )
).flat();

for (const violation of results) {
  console.error(
    `${violation.file}:${violation.line}  ${violation.rule}  ${violation.message}`,
  );
}
if (results.length > 0) {
  console.error(`\n${results.length} guardrail violation(s).`);
  process.exit(1);
}
console.log(`Guardrails OK (${files.length} files).`);
