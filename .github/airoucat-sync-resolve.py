from pathlib import Path


def replace_exact(path: str, old: str, new: str, count: int = 1) -> None:
    p = Path(path)
    text = p.read_text()
    actual = text.count(old)
    if actual != count:
        raise SystemExit(
            f"{path}: expected {count} match(es), found {actual}: {old[:100]!r}"
        )
    p.write_text(text.replace(old, new, count))


init_path = "packages/cli/src/commands/init.ts"
cli_path = "packages/cli/src/cli/index.ts"
readme_path = "README.md"

replace_exact(
    init_path,
    'import { createWorkflowStructure } from "../configurators/workflow.js";\n',
    'import { createWorkflowStructure } from "../configurators/workflow.js";\n'
    'import {\n'
    '  configureAiroucat,\n'
    '  resolveAiroucatProfile,\n'
    '} from "../configurators/airoucat.js";\n',
)

replace_exact(
    init_path,
    '  omp?: boolean;\n  grok?: boolean;\n  kimi?: boolean;\n  snow?: boolean;\n  yes?: boolean;\n',
    '  omp?: boolean;\n  grok?: boolean;\n  kimi?: boolean;\n  snow?: boolean;\n'
    '  airoucat?: boolean;\n'
    '  profile?: string;\n'
    '  graphify?: boolean;\n'
    '  ambient?: boolean;\n'
    '  strictEvidence?: boolean;\n'
    '  yes?: boolean;\n',
)

replace_exact(
    init_path,
    '  const cwd = process.cwd();\n'
    '  const isFirstInit = !fs.existsSync(path.join(cwd, DIR_NAMES.WORKFLOW));\n'
    '  // Captured here (before createWorkflowStructure + init_developer run) so\n',
    '  const cwd = process.cwd();\n'
    '  const isFirstInit = !fs.existsSync(path.join(cwd, DIR_NAMES.WORKFLOW));\n'
    '  const airoucatEnabled = options.airoucat === true;\n'
    '  const airoucatProfile = airoucatEnabled\n'
    '    ? resolveAiroucatProfile(options.profile)\n'
    '    : "default";\n'
    '  // Captured here (before createWorkflowStructure + init_developer run) so\n',
)

replace_exact(
    init_path,
    '  let doAddPlatforms = explicitTools.length > 0;\n'
    '  let doAddDeveloper = !!options.user;\n'
    '  let platformsToAdd: string[] = explicitTools;\n\n'
    '  // No explicit flags → show menu\n'
    '  if (!doAddPlatforms && !doAddDeveloper) {\n',
    '  let doAddPlatforms = explicitTools.length > 0;\n'
    '  let doAddDeveloper = !!options.user;\n'
    '  const doAiroucat = options.airoucat === true;\n'
    '  let platformsToAdd: string[] = explicitTools;\n\n'
    '  // No explicit action → show menu. Airoucat is itself a re-init action.\n'
    '  if (!doAddPlatforms && !doAddDeveloper && !doAiroucat) {\n',
)

replace_exact(
    init_path,
    '  return true;\n}\n\n/**\n * Interactive opt-in for the Claude Code statusLine',
    '''  if (doAiroucat) {
    const configuredPlatformsAfter = getConfiguredPlatforms(cwd);
    const airoucatWritten = startRecordingWrites(cwd);
    try {
      await configureAiroucat(cwd, {
        profile: resolveAiroucatProfile(options.profile),
        ambient: options.ambient !== false,
        graphify: options.graphify === true,
        strictEvidence: options.strictEvidence === true,
        codex: configuredPlatformsAfter.has("codex"),
        claude: configuredPlatformsAfter.has("claude-code"),
      });
    } finally {
      stopRecordingWrites();
    }
    initializeHashes(cwd, { trackedPaths: airoucatWritten, merge: true });
  }

  return true;
}

/**
 * Interactive opt-in for the Claude Code statusLine''',
)

replace_exact(
    init_path,
    '    // Create root files (skip if exists)\n    await createRootFiles(cwd);\n',
    '''    // Create root files (skip if exists)
    await createRootFiles(cwd);

    if (airoucatEnabled) {
      await configureAiroucat(cwd, {
        profile: airoucatProfile,
        ambient: options.ambient !== false,
        graphify: options.graphify === true,
        strictEvidence: options.strictEvidence === true,
        codex: tools.includes("codex"),
        claude: tools.includes("claude"),
      });
    }
''',
)

replace_exact(
    cli_path,
    '  .option("--snow", "Include Snow CLI skills and commands")\n'
    '  .option(\n    "--with-statusline",\n',
    '  .option("--snow", "Include Snow CLI skills and commands")\n'
    '  .option("--airoucat", "Apply the Airoucat workflow profile overlay")\n'
    '  .option(\n'
    '    "--profile <name>",\n'
    '    "Airoucat profile to apply with --airoucat (default, mod, automation)",\n'
    '  )\n'
    '  .option("--graphify", "Install graphify scripts and local Git hooks")\n'
    '  .option("--ambient", "Enable Airoucat Ambient Mode")\n'
    '  .option("--strict-evidence", "Require strict evidence rules in Airoucat mode")\n'
    '  .option(\n    "--with-statusline",\n',
)

a iroucat_readme = None
