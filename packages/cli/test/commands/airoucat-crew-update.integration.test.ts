/**
 * Full update-pipeline regression for the Airoucat Pi crew.
 *
 * This intentionally calls update(), rather than only testing the overlay
 * helper. Without applyAiroucatUpdateOverlay(), the normal same-version update
 * would see the hash-tracked crew-patched workflow/config/Pi settings as
 * pristine old templates and replace them with upstream base templates.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

vi.mock("figlet", () => ({
  default: { textSync: vi.fn(() => "TRELLIS") },
}));

vi.mock("inquirer", () => ({
  default: { prompt: vi.fn().mockResolvedValue({ proceed: true }) },
}));

vi.mock("node:child_process", () => ({
  execSync: vi.fn().mockReturnValue(""),
}));

import { execSync } from "node:child_process";
import { init } from "../../src/commands/init.js";
import { update } from "../../src/commands/update.js";
import { VERSION } from "../../src/constants/version.js";
import { DIR_NAMES, PATHS } from "../../src/constants/paths.js";

const noop = () => undefined;

describe("Airoucat crew update durability", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "trellis-crew-update-"));
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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: VERSION }),
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("keeps crew authority, Pi packages, worker, and Airoucat config after update()", async () => {
    await init({
      yes: true,
      user: "crew-update-user",
      crew: true,
      profile: "mod",
      strictEvidence: true,
    } as Parameters<typeof init>[0]);

    await update({});

    const workflow = fs.readFileSync(
      path.join(tmpDir, PATHS.WORKFLOW_GUIDE_FILE),
      "utf-8",
    );
    expect(workflow).toContain("Airoucat Ambient Intent Router");
    expect(workflow).toContain("### Crew Authority");
    expect(workflow.match(/<!-- AIR_OUCAT:START -->/g)).toHaveLength(1);

    const config = fs.readFileSync(
      path.join(tmpDir, DIR_NAMES.WORKFLOW, "config.yaml"),
      "utf-8",
    );
    expect(config).toContain("crew:");
    expect(config).toContain("enabled: true");
    expect(config).toContain('worker_model: "deepseek/deepseek-v4-flash"');

    const piSettings = JSON.parse(
      fs.readFileSync(path.join(tmpDir, ".pi", "settings.json"), "utf-8"),
    ) as {
      packages?: unknown[];
      compaction?: { enabled?: boolean };
    };
    expect(piSettings.packages).toContain("npm:@cortexkit/pi-magic-context");
    expect(piSettings.packages).toContain("npm:@cortexkit/aft-pi");
    expect(piSettings.compaction?.enabled).toBe(false);

    expect(
      fs.existsSync(path.join(tmpDir, ".pi", "agents", "trellis-worker.md")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmpDir, ".agents", "skills", "trellis-crew", "SKILL.md")),
    ).toBe(true);
  });
});
