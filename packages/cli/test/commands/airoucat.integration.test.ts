/**
 * Integration coverage for the Airoucat fork overlay.
 *
 * Kept separate from upstream init.integration.test.ts so upstream test-suite
 * growth does not become a recurring merge-conflict surface for this fork.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

vi.mock("figlet", () => ({
  default: { textSync: vi.fn(() => "TRELLIS") },
}));

vi.mock("inquirer", () => ({
  default: { prompt: vi.fn().mockResolvedValue({}) },
}));

vi.mock("node:child_process", () => ({
  execSync: vi.fn().mockReturnValue(""),
}));

import { execSync } from "node:child_process";
import { init } from "../../src/commands/init.js";
import { DIR_NAMES, PATHS } from "../../src/constants/paths.js";

const noop = () => undefined;

describe("Airoucat init overlay", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "trellis-airoucat-int-"));
    vi.spyOn(process, "cwd").mockReturnValue(tmpDir);
    vi.spyOn(console, "log").mockImplementation(noop);
    vi.spyOn(console, "warn").mockImplementation(noop);
    vi.spyOn(console, "error").mockImplementation(noop);
    vi.mocked(execSync).mockClear();
    vi.mocked(execSync).mockImplementation(((cmd: string) => {
      const expectedPythonCmd =
        process.platform === "win32" ? "python" : "python3";
      if (cmd === `${expectedPythonCmd} --version`) {
        return "Python 3.11.12";
      }
      return "";
    }) as typeof execSync);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates the mod profile, hostile review assets, graphify hooks, and tracked evidence specs", async () => {
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      `${JSON.stringify({ scripts: { test: "vitest run" } }, null, 2)}\n`,
    );

    await init({
      yes: true,
      airoucat: true,
      profile: "mod",
      ambient: true,
      graphify: true,
      strictEvidence: true,
      codex: true,
      claude: true,
    } as Parameters<typeof init>[0]);

    const workflow = fs.readFileSync(
      path.join(tmpDir, PATHS.WORKFLOW_GUIDE_FILE),
      "utf-8",
    );
    expect(workflow).toContain("[workflow-state:needs_evidence]");
    expect(workflow).toContain("Ambient Intent Router");
    expect(workflow).toContain("Hostile Review");

    const config = fs.readFileSync(
      path.join(tmpDir, DIR_NAMES.WORKFLOW, "config.yaml"),
      "utf-8",
    );
    expect(config).toContain("airoucat:");
    expect(config).toContain("profile: mod");
    expect(config).toContain("strict: true");
    expect(config).toContain("enabled: true");

    const requiredFiles = [
      ".trellis/spec/engineering/user-intent-routing.md",
      ".trellis/spec/engineering/evidence-rules.md",
      ".trellis/spec/engineering/hostile-review.md",
      ".trellis/spec/engineering/no-fake-closeout.md",
      ".trellis/spec/engineering/graphify-rules.md",
      ".trellis/spec/engineering/testing-gates.md",
      ".trellis/spec/engineering/review-checklist.md",
      ".trellis/spec/project/non-goals.md",
      ".trellis/spec/runtime/runtime-evidence.md",
      ".trellis/spec/runtime/compatibility-boundaries.md",
      ".trellis/spec/runtime/no-legacy-authority.md",
      ".trellis/spec/runtime/integration-test-policy.md",
      ".agents/skills/trellis-hostile-review/SKILL.md",
      ".codex/skills/trellis-hostile-review/SKILL.md",
      ".claude/skills/trellis-hostile-review/SKILL.md",
      ".claude/commands/trellis/hostile-review.md",
      ".codex/prompts/trellis-hostile-review.md",
      "scripts/dev/setup_graphify_local.py",
      ".githooks/graphify-common.sh",
      ".githooks/post-commit",
      ".githooks/post-checkout",
      ".githooks/post-merge",
      ".githooks/post-rewrite",
    ];
    for (const relativePath of requiredFiles) {
      expect(fs.existsSync(path.join(tmpDir, relativePath))).toBe(true);
    }

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(tmpDir, "package.json"), "utf-8"),
    ) as { scripts?: Record<string, string> };
    expect(packageJson.scripts?.["graphify:setup"]).toBe(
      "python3 scripts/dev/setup_graphify_local.py",
    );
    expect(packageJson.scripts?.["graphify:rebuild"]).toBe(
      "python3 scripts/dev/setup_graphify_local.py --rebuild",
    );

    const hashFile = JSON.parse(
      fs.readFileSync(
        path.join(tmpDir, DIR_NAMES.WORKFLOW, ".template-hashes.json"),
        "utf-8",
      ),
    ) as { hashes?: Record<string, string> };
    expect(
      hashFile.hashes?.[".agents/skills/trellis-hostile-review/SKILL.md"],
    ).toBeDefined();
  });

  it("rejects unsupported profiles", async () => {
    await expect(
      init({
        yes: true,
        airoucat: true,
        profile: "unsupported",
      } as Parameters<typeof init>[0]),
    ).rejects.toThrow(/Unsupported Airoucat profile/);
  });

  it("keeps the default profile lean", async () => {
    await init({
      yes: true,
      airoucat: true,
      codex: true,
    } as Parameters<typeof init>[0]);

    expect(
      fs.existsSync(
        path.join(
          tmpDir,
          ".trellis",
          "spec",
          "engineering",
          "user-intent-routing.md",
        ),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(tmpDir, ".trellis", "spec", "runtime", "runtime-evidence.md"),
      ),
    ).toBe(false);
    expect(
      fs.existsSync(
        path.join(tmpDir, "scripts", "dev", "setup_graphify_local.py"),
      ),
    ).toBe(false);
  });

  it("can apply the overlay later to an already initialized project", async () => {
    await init({
      yes: true,
      user: "test-user",
      codex: true,
    } as Parameters<typeof init>[0]);

    const evidenceSpec = path.join(
      tmpDir,
      ".trellis",
      "spec",
      "engineering",
      "evidence-rules.md",
    );
    expect(fs.existsSync(evidenceSpec)).toBe(false);

    await init({
      yes: true,
      airoucat: true,
      profile: "automation",
    } as Parameters<typeof init>[0]);

    expect(fs.existsSync(evidenceSpec)).toBe(true);
    expect(
      fs.existsSync(
        path.join(tmpDir, ".codex", "prompts", "trellis-hostile-review.md"),
      ),
    ).toBe(true);

    const hashFile = JSON.parse(
      fs.readFileSync(
        path.join(tmpDir, DIR_NAMES.WORKFLOW, ".template-hashes.json"),
        "utf-8",
      ),
    ) as { hashes?: Record<string, string> };
    expect(
      hashFile.hashes?.[".agents/skills/trellis-hostile-review/SKILL.md"],
    ).toBeDefined();
  });
});
