from pathlib import Path


def replace_exact(path: str, old: str, new: str, count: int = 1) -> None:
    p = Path(path)
    text = p.read_text()
    actual = text.count(old)
    if actual != count:
        raise SystemExit(
            f"{path}: expected {count} match(es), found {actual}: {old[:120]!r}"
        )
    p.write_text(text.replace(old, new, count))


init_path = "packages/cli/src/commands/init.ts"
cli_path = "packages/cli/src/cli/index.ts"
update_path = "packages/cli/src/commands/update.ts"
pi_ext_path = "packages/cli/src/templates/pi/extensions/trellis/index.ts.txt"

replace_exact(
    init_path,
    'import {\n  configureAiroucat,\n  resolveAiroucatProfile,\n} from "../configurators/airoucat.js";\n',
    'import {\n  configureAiroucat,\n  resolveAiroucatCrewModel,\n  resolveAiroucatProfile,\n} from "../configurators/airoucat.js";\n',
)

replace_exact(
    init_path,
    '  graphify?: boolean;\n  ambient?: boolean;\n  strictEvidence?: boolean;\n  yes?: boolean;\n',
    '  graphify?: boolean;\n  ambient?: boolean;\n  strictEvidence?: boolean;\n'
    '  crew?: boolean;\n'
    '  crewModel?: string;\n'
    '  yes?: boolean;\n',
)

replace_exact(
    init_path,
    '  if (options.windsurf) {\n'
    '    options.devin = true;\n'
    '    delete options.windsurf;\n'
    '  }\n\n'
    '  const cwd = process.cwd();\n',
    '  if (options.windsurf) {\n'
    '    options.devin = true;\n'
    '    delete options.windsurf;\n'
    '  }\n\n'
    '  // Airoucat crew is a Pi-backed execution profile. Keep it turnkey on\n'
    '  // both fresh init and re-init: one flag installs the overlay and Pi.\n'
    '  if (options.crew) {\n'
    '    options.airoucat = true;\n'
    '    options.pi = true;\n'
    '  }\n\n'
    '  const cwd = process.cwd();\n',
)

replace_exact(
    init_path,
    '        strictEvidence: options.strictEvidence === true,\n'
    '        codex: configuredPlatformsAfter.has("codex"),\n'
    '        claude: configuredPlatformsAfter.has("claude-code"),\n',
    '        strictEvidence: options.strictEvidence === true,\n'
    '        codex: configuredPlatformsAfter.has("codex"),\n'
    '        claude: configuredPlatformsAfter.has("claude-code"),\n'
    '        pi: configuredPlatformsAfter.has("pi"),\n'
    '        crew: options.crew === true,\n'
    '        crewModel: resolveAiroucatCrewModel(options.crewModel),\n',
)

replace_exact(
    init_path,
    '        strictEvidence: options.strictEvidence === true,\n'
    '        codex: tools.includes("codex"),\n'
    '        claude: tools.includes("claude"),\n',
    '        strictEvidence: options.strictEvidence === true,\n'
    '        codex: tools.includes("codex"),\n'
    '        claude: tools.includes("claude"),\n'
    '        pi: tools.includes("pi"),\n'
    '        crew: options.crew === true,\n'
    '        crewModel: resolveAiroucatCrewModel(options.crewModel),\n',
)

replace_exact(
    cli_path,
    '  .option("--strict-evidence", "Require strict evidence rules in Airoucat mode")\n'
    '  .option(\n'
    '    "--with-statusline",\n',
    '  .option("--strict-evidence", "Require strict evidence rules in Airoucat mode")\n'
    '  .option(\n'
    '    "--crew",\n'
    '    "Install the Airoucat Pi construction crew (implies --airoucat and --pi)",\n'
    '  )\n'
    '  .option(\n'
    '    "--crew-model <provider/model>",\n'
    '    "Pi model used by bounded crew workers (default: deepseek/deepseek-v4-flash)",\n'
    '  )\n'
    '  .option(\n'
    '    "--with-statusline",\n',
)

replace_exact(
    update_path,
    'import { preserveCodexAgentModelKeys } from "../configurators/codex.js";\n',
    'import { preserveCodexAgentModelKeys } from "../configurators/codex.js";\n'
    'import { applyAiroucatUpdateOverlay } from "../configurators/airoucat.js";\n',
)

replace_exact(
    update_path,
    '  preserveExistingClaudeStatusLine(cwd, files);\n\n'
    '  for (const [filePath, content] of await collectRegistrySpecTemplates(cwd)) {\n',
    '  preserveExistingClaudeStatusLine(cwd, files);\n\n'
    '  // Fork-owned overlays are applied after current upstream templates are\n'
    '  // collected so `trellis update` refreshes both layers without erasing\n'
    '  // Airoucat/crew-managed project configuration.\n'
    '  applyAiroucatUpdateOverlay(cwd, files);\n\n'
    '  for (const [filePath, content] of await collectRegistrySpecTemplates(cwd)) {\n',
)

replace_exact(
    pi_ext_path,
    '      ...process.env,\n'
    '      TRELLIS_SUBAGENT_CHILD: "1",\n'
    '      ...(key ? { TRELLIS_CONTEXT_ID: key } : {}),\n',
    '      ...process.env,\n'
    '      TRELLIS_SUBAGENT_CHILD: "1",\n'
    '      // Trellis already injects a bounded task snapshot into child workers.\n'
    '      // Keep Magic Context in the long-lived foreman session only; its Pi\n'
    '      // extension recognizes this guard and no-ops in the ephemeral child.\n'
    '      MAGIC_CONTEXT_PI_SUBAGENT: "1",\n'
    '      ...(key ? { TRELLIS_CONTEXT_ID: key } : {}),\n',
)
