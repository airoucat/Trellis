/**
 * Airoucat profile templates.
 *
 * These templates are optional overlays applied by `trellis init --airoucat`.
 * They are intentionally separate from the core Trellis templates so the fork
 * stays easy to rebase against upstream.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readTemplate(relativePath: string): string {
  return readFileSync(join(__dirname, relativePath), "utf-8");
}

function toPosixRelativePath(root: string, filePath: string): string {
  return relative(root, filePath).split(sep).join("/");
}

function readDirectoryTemplates(dir: string): Map<string, string> {
  const root = join(__dirname, dir);
  const files = new Map<string, string>();

  function walk(currentDir: string): void {
    for (const entry of readdirSync(currentDir)) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        files.set(
          toPosixRelativePath(root, fullPath),
          readFileSync(fullPath, "utf-8"),
        );
      }
    }
  }

  walk(root);
  return files;
}

export const workflowAddendumTemplate = readTemplate("workflow-addendum.md");
export const agentsAddendumTemplate = readTemplate("agents-addendum.md");
export const hostileReviewSkillTemplate = readTemplate(
  "skills/trellis-hostile-review/SKILL.md",
);
export const hostileReviewCommandTemplate = readTemplate(
  "commands/hostile-review.md",
);
export const graphifySetupScriptTemplate = readTemplate(
  "graphify/scripts/dev/setup_graphify_local.py",
);

export function getAiroucatSpecTemplates(): Map<string, string> {
  return readDirectoryTemplates("spec");
}

export function getAiroucatGraphifyHookTemplates(): Map<string, string> {
  return readDirectoryTemplates("graphify/githooks");
}
