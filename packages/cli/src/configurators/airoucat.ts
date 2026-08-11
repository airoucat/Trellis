import fs from "node:fs";
import path from "node:path";

import { DIR_NAMES, FILE_NAMES, PATHS } from "../constants/paths.js";
import {
  agentsAddendumTemplate,
  crewAftConfigTemplate,
  crewMagicContextConfigTemplate,
  crewPromptTemplate,
  crewSkillTemplate,
  crewSpecTemplate,
  crewWorkerAgentTemplate,
  getAiroucatGraphifyHookTemplates,
  getAiroucatSpecTemplates,
  graphifySetupScriptTemplate,
  hostileReviewCommandTemplate,
  hostileReviewSkillTemplate,
  workflowAddendumTemplate,
} from "../templates/airoucat/index.js";
import { agentsMdContent } from "../templates/markdown/index.js";
import { ensureDir, writeFile } from "../utils/file-writer.js";
import { updateHashFromFile } from "../utils/template-hash.js";

export const AIR_OUCAT_PROFILES = ["default", "mod", "automation"] as const;
export const DEFAULT_AIROUCAT_CREW_MODEL = "deepseek/deepseek-v4-flash";

export type AiroucatProfile = (typeof AIR_OUCAT_PROFILES)[number];

export interface AiroucatConfiguratorOptions {
  profile: AiroucatProfile;
  ambient: boolean;
  graphify: boolean;
  strictEvidence: boolean;
  codex: boolean;
  claude: boolean;
  pi: boolean;
  crew: boolean;
  crewModel: string;
}

const AIR_OUCAT_BLOCK_START = "<!-- AIR_OUCAT:START -->";
const AIR_OUCAT_BLOCK_END = "<!-- AIR_OUCAT:END -->";
const AIR_OUCAT_CONFIG_START = "# BEGIN AIR_OUCAT";
const AIR_OUCAT_CONFIG_END = "# END AIR_OUCAT";
const AIR_OUCAT_GITIGNORE_START = "# BEGIN AIR_OUCAT GRAPHIFY";
const AIR_OUCAT_GITIGNORE_END = "# END AIR_OUCAT GRAPHIFY";
const AIR_OUCAT_CREW_GITIGNORE_START = "# BEGIN AIR_OUCAT CREW";
const AIR_OUCAT_CREW_GITIGNORE_END = "# END AIR_OUCAT CREW";
const PI_SETTINGS_PATH = ".pi/settings.json";
const AIR_OUCAT_CREW_PACKAGES = [
  "npm:@cortexkit/pi-magic-context",
  "npm:@cortexkit/aft-pi",
] as const;

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

export function resolveAiroucatCrewModel(input: unknown): string {
  const model =
    typeof input === "string" && input.trim()
      ? input.trim()
      : DEFAULT_AIROUCAT_CREW_MODEL;
  if (!/^[^\s/]+\/.+/.test(model)) {
    throw new Error(
      `Invalid Airoucat crew model "${model}". Expected a Pi provider/model reference such as ${DEFAULT_AIROUCAT_CREW_MODEL}.`,
    );
  }
  return model;
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

function getBlock(content: string, start: string, end: string): string | null {
  const startIndex = content.indexOf(start);
  if (startIndex < 0) return null;
  const endIndex = content.indexOf(end, startIndex);
  if (endIndex < 0) return null;
  return content.slice(startIndex, endIndex + end.length);
}

function renderCrewTemplate(template: string, crewModel: string): string {
  return template.replaceAll("{{CREW_MODEL}}", crewModel);
}

function buildAiroucatConfig(options: AiroucatConfiguratorOptions): string {
  const crew = options.crew
    ? `  crew:\n    enabled: true\n    worker_model: ${JSON.stringify(options.crewModel)}\n    default_parallel_workers: 3\n    max_parallel_workers: 6\n    magic_context: true\n    aft: true\n`
    : "";
  return `${AIR_OUCAT_CONFIG_START}
airoucat:
  ambient_mode: ${options.ambient}
  profile: ${options.profile}
${crew}  graphify:
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
      { executable: true },
    );
  }

  patchTextFileBlock(
    path.join(cwd, ".gitignore"),
    `${AIR_OUCAT_GITIGNORE_START}\ngraphify-out/\n${AIR_OUCAT_GITIGNORE_END}`,
    AIR_OUCAT_GITIGNORE_START,
    AIR_OUCAT_GITIGNORE_END,
  );
  patchPackageJsonScripts(cwd);
}

function packageEntrySource(entry: unknown): string | null {
  if (typeof entry === "string") return entry;
  if (
    entry !== null &&
    typeof entry === "object" &&
    "source" in entry &&
    typeof (entry as { source?: unknown }).source === "string"
  ) {
    return (entry as { source: string }).source;
  }
  return null;
}

function hasCrewPackage(entries: unknown[], packageName: string): boolean {
  return entries.some((entry) =>
    packageEntrySource(entry)?.includes(packageName),
  );
}

export function patchAiroucatCrewPiSettingsContent(content: string): string {
  const settings = JSON.parse(content) as Record<string, unknown>;
  const packages = Array.isArray(settings.packages)
    ? [...settings.packages]
    : [];

  if (!hasCrewPackage(packages, "@cortexkit/pi-magic-context")) {
    packages.push(AIR_OUCAT_CREW_PACKAGES[0]);
  }
  if (!hasCrewPackage(packages, "@cortexkit/aft-pi")) {
    packages.push(AIR_OUCAT_CREW_PACKAGES[1]);
  }
  settings.packages = packages;

  const existingCompaction =
    settings.compaction !== null && typeof settings.compaction === "object"
      ? (settings.compaction as Record<string, unknown>)
      : {};
  settings.compaction = { ...existingCompaction, enabled: false };

  return `${JSON.stringify(settings, null, 2)}\n`;
}

function patchPiCrewSettings(cwd: string): void {
  const settingsPath = path.join(cwd, PI_SETTINGS_PATH);
  if (!fs.existsSync(settingsPath)) {
    throw new Error(
      "Airoucat crew mode requires the Pi platform. Re-run with --crew (which implies --pi) or add --pi first.",
    );
  }

  let next: string;
  try {
    next = patchAiroucatCrewPiSettingsContent(
      fs.readFileSync(settingsPath, "utf-8"),
    );
  } catch (error) {
    throw new Error(
      `.pi/settings.json is not valid JSON; cannot safely enable Airoucat crew packages: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  fs.writeFileSync(settingsPath, next, "utf-8");
  updateHashFromFile(cwd, PI_SETTINGS_PATH);
}

async function writePiCrewFiles(cwd: string, crewModel: string): Promise<void> {
  patchPiCrewSettings(cwd);

  await writeTemplateFile(
    path.join(cwd, ".pi", "agents", "trellis-worker.md"),
    renderCrewTemplate(crewWorkerAgentTemplate, crewModel),
  );
  await writeTemplateFile(
    path.join(cwd, ".pi", "prompts", "trellis-crew.md"),
    crewPromptTemplate,
  );
  await writeTemplateFile(
    path.join(cwd, ".agents", "skills", "trellis-crew", "SKILL.md"),
    crewSkillTemplate,
  );
  await writeTemplateFile(
    path.join(cwd, PATHS.SPEC, "engineering", "crew-orchestration.md"),
    crewSpecTemplate,
  );
  await writeTemplateFile(
    path.join(cwd, ".cortexkit", "magic-context.jsonc"),
    renderCrewTemplate(crewMagicContextConfigTemplate, crewModel),
  );
  await writeTemplateFile(
    path.join(cwd, ".cortexkit", "aft.jsonc"),
    crewAftConfigTemplate,
  );

  patchTextFileBlock(
    path.join(cwd, ".gitignore"),
    `${AIR_OUCAT_CREW_GITIGNORE_START}\n.pi/npm/\n.pi/git/\n${AIR_OUCAT_CREW_GITIGNORE_END}`,
    AIR_OUCAT_CREW_GITIGNORE_START,
    AIR_OUCAT_CREW_GITIGNORE_END,
  );
}

async function writeAiroucatAgents(cwd: string): Promise<void> {
  const agentsPath = path.join(cwd, FILE_NAMES.AGENTS);
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

function crewModelFromConfigBlock(block: string): string {
  const raw = block.match(/^\s*worker_model:\s*(.+?)\s*$/m)?.[1]?.trim();
  if (!raw) return DEFAULT_AIROUCAT_CREW_MODEL;
  try {
    if (raw.startsWith('"')) return JSON.parse(raw) as string;
  } catch {
    return DEFAULT_AIROUCAT_CREW_MODEL;
  }
  return raw.replace(/^['"]|['"]$/g, "") || DEFAULT_AIROUCAT_CREW_MODEL;
}

function configBlockHasEnabled(block: string, section: string): boolean {
  const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `^\\s{2}${escaped}:\\s*$[\\s\\S]*?^\\s{4}enabled:\\s*true\\s*$`,
    "m",
  ).test(block);
}

function applyCrewUpdateTemplates(
  templates: Map<string, string>,
  crewModel: string,
): void {
  const piSettings = templates.get(PI_SETTINGS_PATH);
  if (piSettings) {
    templates.set(
      PI_SETTINGS_PATH,
      patchAiroucatCrewPiSettingsContent(piSettings),
    );
  }
  templates.set(
    ".pi/agents/trellis-worker.md",
    renderCrewTemplate(crewWorkerAgentTemplate, crewModel),
  );
  templates.set(".pi/prompts/trellis-crew.md", crewPromptTemplate);
  templates.set(".agents/skills/trellis-crew/SKILL.md", crewSkillTemplate);
  templates.set(
    ".cortexkit/magic-context.jsonc",
    renderCrewTemplate(crewMagicContextConfigTemplate, crewModel),
  );
  templates.set(".cortexkit/aft.jsonc", crewAftConfigTemplate);
}

/**
 * Re-apply fork-owned generated surfaces to the desired template map during
 * `trellis update`. This keeps upstream refreshes from erasing Airoucat or
 * crew configuration while preserving normal hash/conflict semantics.
 */
export function applyAiroucatUpdateOverlay(
  cwd: string,
  templates: Map<string, string>,
): void {
  const configPath = path.join(cwd, DIR_NAMES.WORKFLOW, "config.yaml");
  if (!fs.existsSync(configPath)) return;

  const installedConfig = fs.readFileSync(configPath, "utf-8");
  const configBlock = getBlock(
    installedConfig,
    AIR_OUCAT_CONFIG_START,
    AIR_OUCAT_CONFIG_END,
  );
  if (!configBlock) return;

  const desiredConfig = templates.get(`${DIR_NAMES.WORKFLOW}/config.yaml`);
  if (desiredConfig) {
    templates.set(
      `${DIR_NAMES.WORKFLOW}/config.yaml`,
      replaceOrAppendBlock(
        desiredConfig,
        configBlock,
        AIR_OUCAT_CONFIG_START,
        AIR_OUCAT_CONFIG_END,
      ),
    );
  }

  const desiredWorkflow = templates.get(PATHS.WORKFLOW_GUIDE_FILE);
  if (desiredWorkflow) {
    templates.set(
      PATHS.WORKFLOW_GUIDE_FILE,
      replaceOrAppendBlock(
        desiredWorkflow,
        workflowAddendumTemplate,
        AIR_OUCAT_BLOCK_START,
        AIR_OUCAT_BLOCK_END,
      ),
    );
  }

  templates.set(
    ".agents/skills/trellis-hostile-review/SKILL.md",
    hostileReviewSkillTemplate,
  );
  if (fs.existsSync(path.join(cwd, ".codex"))) {
    templates.set(
      ".codex/skills/trellis-hostile-review/SKILL.md",
      hostileReviewSkillTemplate,
    );
    templates.set(
      ".codex/prompts/trellis-hostile-review.md",
      hostileReviewCommandTemplate,
    );
  }
  if (fs.existsSync(path.join(cwd, ".claude"))) {
    templates.set(
      ".claude/skills/trellis-hostile-review/SKILL.md",
      hostileReviewSkillTemplate,
    );
    templates.set(
      ".claude/commands/trellis/hostile-review.md",
      hostileReviewCommandTemplate,
    );
  }

  if (configBlockHasEnabled(configBlock, "crew")) {
    applyCrewUpdateTemplates(templates, crewModelFromConfigBlock(configBlock));
  }

  if (configBlockHasEnabled(configBlock, "graphify")) {
    templates.set(
      "scripts/dev/setup_graphify_local.py",
      graphifySetupScriptTemplate,
    );
    for (const [relativePath, content] of getAiroucatGraphifyHookTemplates()) {
      templates.set(`.githooks/${relativePath}`, content);
    }
  }
}

function refreshPatchedManagedHashes(
  cwd: string,
  options: AiroucatConfiguratorOptions,
): void {
  for (const relativePath of [
    `${DIR_NAMES.WORKFLOW}/config.yaml`,
    PATHS.WORKFLOW_GUIDE_FILE,
    FILE_NAMES.AGENTS,
    ...(options.crew ? [PI_SETTINGS_PATH] : []),
  ]) {
    updateHashFromFile(cwd, relativePath);
  }
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
  if (options.crew) {
    if (!options.pi) {
      throw new Error("Airoucat crew mode requires Pi to be configured.");
    }
    await writePiCrewFiles(cwd, resolveAiroucatCrewModel(options.crewModel));
  }
  patchAiroucatConfig(cwd, options);
  refreshPatchedManagedHashes(cwd, options);
}
