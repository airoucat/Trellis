import fs from "node:fs";
import path from "node:path";

import { DIR_NAMES, PATHS } from "../constants/paths.js";
import {
  agentsAddendumTemplate,
  getAiroucatGraphifyHookTemplates,
  getAiroucatSpecTemplates,
  graphifySetupScriptTemplate,
  hostileReviewCommandTemplate,
  hostileReviewSkillTemplate,
  workflowAddendumTemplate,
} from "../templates/airoucat/index.js";
import { agentsMdContent } from "../templates/markdown/index.js";
import { ensureDir, writeFile } from "../utils/file-writer.js";

export const AIR_OUCAT_PROFILES = ["default", "mod", "automation"] as const;

export type AiroucatProfile = (typeof AIR_OUCAT_PROFILES)[number];

export interface AiroucatConfiguratorOptions {
  profile: AiroucatProfile;
  ambient: boolean;
  graphify: boolean;
  strictEvidence: boolean;
  codex: boolean;
  claude: boolean;
}

const AIR_OUCAT_BLOCK_START = "<!-- AIR_OUCAT:START -->";
const AIR_OUCAT_BLOCK_END = "<!-- AIR_OUCAT:END -->";
const AIR_OUCAT_CONFIG_START = "# BEGIN AIR_OUCAT";
const AIR_OUCAT_CONFIG_END = "# END AIR_OUCAT";
const AIR_OUCAT_GITIGNORE_START = "# BEGIN AIR_OUCAT GRAPHIFY";
const AIR_OUCAT_GITIGNORE_END = "# END AIR_OUCAT GRAPHIFY";

export function resolveAiroucatProfile(input: unknown): AiroucatProfile {
  const profile =
    typeof input === "string" && input.trim() ? input.trim() : "default";
  if ((AIR_OUCAT_PROFILES as readonly string[]).includes(profile)) {
    return profile as AiroucatProfile;
  }
  throw new Error(
    `Unsupported Airoucat profile "${profile}". Supported profiles: ${AIR_OUCAT_PROFILES.join(
      ", ",
    )}.`,
  );
}

function replaceOrAppendBlock(
  content: string,
  block: string,
  start: string,
  end: string,
): string {
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end);
  if (startIndex >= 0 && endIndex > startIndex) {
    return (
      content.slice(0, startIndex).trimEnd() +
      "\n\n" +
      block.trim() +
      "\n" +
      content.slice(endIndex + end.length).trimEnd() +
      "\n"
    );
  }
  return `${content.trimEnd()}\n\n${block.trim()}\n`;
}

function buildAiroucatConfig(options: AiroucatConfiguratorOptions): string {
  return `${AIR_OUCAT_CONFIG_START}
airoucat:
  ambient_mode: ${options.ambient}
  profile: ${options.profile}
  graphify:
    enabled: ${options.graphify}
    rebuild_before_finish: ${options.graphify}
    commit_output: false
  evidence:
    strict: ${options.strictEvidence}
    require_runtime_evidence_for_runtime_changes: ${options.profile === "mod"}
  review:
    hostile_review_enabled: true
    hostile_review_before_finish: true
${AIR_OUCAT_CONFIG_END}`;
}

function patchTextFileBlock(
  filePath: string,
  block: string,
  start: string,
  end: string,
): void {
  const current = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, "utf-8")
    : "";
  const next = replaceOrAppendBlock(current, block, start, end);
  if (next !== current) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, next, "utf-8");
  }
}

async function writeTemplateFile(
  filePath: string,
  content: string,
  options?: { executable?: boolean },
): Promise<void> {
  ensureDir(path.dirname(filePath));
  await writeFile(filePath, content, options);
}

function patchPackageJsonScripts(cwd: string): void {
  const packagePath = path.join(cwd, "package.json");
  if (!fs.existsSync(packagePath)) return;

  const raw = fs.readFileSync(packagePath, "utf-8");
  const data = JSON.parse(raw) as {
    scripts?: Record<string, string>;
    [key: string]: unknown;
  };
  const scripts = { ...(data.scripts ?? {}) };
  let changed = false;

  if (!scripts["graphify:setup"]) {
    scripts["graphify:setup"] = "python3 scripts/dev/setup_graphify_local.py";
    changed = true;
  }
  if (!scripts["graphify:rebuild"]) {
    scripts["graphify:rebuild"] =
      "python3 scripts/dev/setup_graphify_local.py --rebuild";
    changed = true;
  }

  if (!changed) return;
  data.scripts = scripts;
  fs.writeFileSync(packagePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

async function writeAiroucatWorkflow(cwd: string): Promise<void> {
  const workflowPath = path.join(cwd, PATHS.WORKFLOW_GUIDE_FILE);
  const current = fs.readFileSync(workflowPath, "utf-8");
  const next = replaceOrAppendBlock(
    current,
    workflowAddendumTemplate,
    AIR_OUCAT_BLOCK_START,
    AIR_OUCAT_BLOCK_END,
  );
  if (next !== current) {
    fs.writeFileSync(workflowPath, next, "utf-8");
  }
}

async function writeAiroucatSpecs(
  cwd: string,
  profile: AiroucatProfile,
): Promise<void> {
  for (const [relativePath, content] of getAiroucatSpecTemplates()) {
    if (relativePath.startsWith("runtime/") && profile !== "mod") {
      continue;
    }
    await writeTemplateFile(path.join(cwd, PATHS.SPEC, relativePath), content);
  }
}

async function writeHostileReviewFiles(
  cwd: string,
  options: AiroucatConfiguratorOptions,
): Promise<void> {
  await writeTemplateFile(
    path.join(cwd, ".agents", "skills", "trellis-hostile-review", "SKILL.md"),
    hostileReviewSkillTemplate,
  );

  if (options.codex) {
    await writeTemplateFile(
      path.join(cwd, ".codex", "skills", "trellis-hostile-review", "SKILL.md"),
      hostileReviewSkillTemplate,
    );
    await writeTemplateFile(
      path.join(cwd, ".codex", "prompts", "trellis-hostile-review.md"),
      hostileReviewCommandTemplate,
    );
  }

  if (options.claude) {
    await writeTemplateFile(
      path.join(cwd, ".claude", "skills", "trellis-hostile-review", "SKILL.md"),
      hostileReviewSkillTemplate,
    );
    await writeTemplateFile(
      path.join(cwd, ".claude", "commands", "trellis", "hostile-review.md"),
      hostileReviewCommandTemplate,
    );
  }
}

async function writeGraphifyFiles(cwd: string): Promise<void> {
  await writeTemplateFile(
    path.join(cwd, "scripts", "dev", "setup_graphify_local.py"),
    graphifySetupScriptTemplate,
    { executable: true },
  );

  for (const [relativePath, content] of getAiroucatGraphifyHookTemplates()) {
    await writeTemplateFile(
      path.join(cwd, ".githooks", relativePath),
      content,
      {
        executable: true,
      },
    );
  }

  patchTextFileBlock(
    path.join(cwd, ".gitignore"),
    `${AIR_OUCAT_GITIGNORE_START}
graphify-out/
${AIR_OUCAT_GITIGNORE_END}`,
    AIR_OUCAT_GITIGNORE_START,
    AIR_OUCAT_GITIGNORE_END,
  );
  patchPackageJsonScripts(cwd);
}

async function writeAiroucatAgents(cwd: string): Promise<void> {
  const agentsPath = path.join(cwd, "AGENTS.md");
  const base = fs.existsSync(agentsPath)
    ? fs.readFileSync(agentsPath, "utf-8")
    : agentsMdContent;
  const next = replaceOrAppendBlock(
    base,
    agentsAddendumTemplate,
    AIR_OUCAT_BLOCK_START,
    AIR_OUCAT_BLOCK_END,
  );
  if (next !== base) {
    fs.writeFileSync(agentsPath, next, "utf-8");
  }
}

function patchAiroucatConfig(
  cwd: string,
  options: AiroucatConfiguratorOptions,
): void {
  patchTextFileBlock(
    path.join(cwd, DIR_NAMES.WORKFLOW, "config.yaml"),
    buildAiroucatConfig(options),
    AIR_OUCAT_CONFIG_START,
    AIR_OUCAT_CONFIG_END,
  );
}

export async function configureAiroucat(
  cwd: string,
  options: AiroucatConfiguratorOptions,
): Promise<void> {
  await writeAiroucatWorkflow(cwd);
  await writeAiroucatSpecs(cwd, options.profile);
  await writeAiroucatAgents(cwd);
  await writeHostileReviewFiles(cwd, options);
  if (options.graphify) {
    await writeGraphifyFiles(cwd);
  }
  patchAiroucatConfig(cwd, options);
}
