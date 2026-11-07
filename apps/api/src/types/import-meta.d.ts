/**
 * Bun exposes `import.meta.main` so an entry module can tell whether it was
 * executed directly or imported (tests import `app` without starting a
 * listener). The bundled bun-types does not declare it yet.
 */
interface ImportMeta {
  readonly main: boolean;
}
