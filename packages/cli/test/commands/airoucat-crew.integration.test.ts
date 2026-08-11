/**
 * Integration coverage for the optional Airoucat Pi construction crew.
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
import {
  applyAiroucatUpdateOverlay,
  DEFAULT_AIROUCAT_CREW_MODEL,
} from "../../src/configurators/airoucat.js";
import { DIR_NAMES, PATHS } from "../../src/constants/paths.js";
import { getSettingsTemplate } from "../../src/templates/pi/index.js";
import {
  configYamlTemplate,
  workflowMdTemplate,
} from "../../src/templates/trellis/index.js";

const noop = () => undefined;

describe("Airoucat Pi crew", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "trellis-airoucat-crew-"));
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

  it("--crew installs Pi, Airoucat authority rules, CortexKit packages, and a DeepSeek worker", async () => {
    await init({
      yes: true,
      user: "crew-test",
      crew: true,
      profile: "mod",
      strictEvidence: true,
    } as Parameters<typeof init>[0]);

    const piSettings = JSON.parse(
      fs.readFileSync(path.join(tmpDir, ".pi", "settings.json"), "utf-8"),
    ) as {
      packages?: unknown[];
      compaction?: { enabled?: boolean };
    };
    expect(piSettings.packages).toContain("npm:@cortexkit/pi-magic-context");
    expect(piSettings.packages).toContain("npm:@cortexkit/aft-pi");
    expect(piSettings.compaction?.enabled).toBe(false);

    const worker = fs.readFileSync(
      path.join(tmpDir, ".pi", "agents", "trellis-worker.md"),
      "utf-8",
    );
    expect(worker).toContain(`model: ${DEFAULT_AIROUCAT_CREW_MODEL}`);
    expect(worker).toContain("MODEL_MISMATCH");
    expect(worker).toContain("three repair attempts");

    const config = fs.readFileSync(
      path.join(tmpDir, DIR_NAMES.WORKFLOW, "config.yaml"),
      "utf-8",
    );
    expect(config).toContain("crew:");
    expect(config).toContain("enabled: true");
    expect(config).toContain(`worker_model: "${DEFAULT_AIROUCAT_CREW_MODEL}"`);
    expect(config).toContain("max_parallel_workers: 6");

    const required = [
      ".agents/skills/trellis-crew/SKILL.md",
      ".pi/prompts/trellis-crew.md",
      ".trellis/spec/engineering/crew-orchestration.md",
      ".cortexkit/magic-context.jsonc",
      ".cortexkit/aft.jsonc",
    ];
    for (const relativePath of required) {
      expect(fs.existsSync(path.join(tmpDir, relativePath))).toBe(true);
    }

    const magicContext = fs.readFileSync(
      path.join(tmpDir, ".cortexkit", "magic-context.jsonc"),
      "utf-8",
    );
    expect(magicContext).toContain(DEFAULT_AIROUCAT_CREW_MODEL);
    expect(magicContext).toContain("historian");
    expect(magicContext).not.toContain('"dreamer"');

    const workflow = fs.readFileSync(
      path.join(tmpDir, PATHS.WORKFLOW_GUIDE_FILE),
      "utf-8",
    );
    expect(workflow).toContain("### Crew Authority");
    expect(workflow).toContain("trellis-crew");
  });

  it("can add crew mode later to an existing Trellis project without a second workflow", async () => {
    await init({
      yes: true,
      user: "existing-user",
      codex: true,
    } as Parameters<typeof init>[0]);

    expect(fs.existsSync(path.join(tmpDir, ".pi"))).toBe(false);

    await init({
      yes: true,
      crew: true,
      profile: "automation",
    } as Parameters<typeof init>[0]);

    expect(fs.existsSync(path.join(tmpDir, ".pi", "settings.json"))).toBe(true);
    expect(
      fs.existsSync(path.join(tmpDir, ".pi", "agents", "trellis-worker.md")),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          tmpDir,
          ".trellis",
          "spec",
          "engineering",
          "crew-orchestration.md",
        ),
      ),
    ).toBe(true);

    const workflow = fs.readFileSync(
      path.join(tmpDir, PATHS.WORKFLOW_GUIDE_FILE),
      "utf-8",
    );
    expect(workflow.match(/<!-- AIR_OUCAT:START -->/g)).toHaveLength(1);
  });

  it("preserves existing project Pi settings and package entries while enabling crew", async () => {
    await init({
      yes: true,
      user: "pi-user",
      pi: true,
    } as Parameters<typeof init>[0]);

    const settingsPath = path.join(tmpDir, ".pi", "settings.json");
    const existing = JSON.parse(
      fs.readFileSync(settingsPath, "utf-8"),
    ) as Record<string, unknown>;
    existing.theme = "light";
    existing.packages = [
      "npm:existing-project-package",
      { source: "npm:@cortexkit/aft-pi@0.49.4", extensions: [] },
    ];
    existing.compaction = { reserveTokens: 4096, enabled: true };
    fs.writeFileSync(settingsPath, `${JSON.stringify(existing, null, 2)}\n`);

    await init({ yes: true, crew: true } as Parameters<typeof init>[0]);

    const patched = JSON.parse(fs.readFileSync(settingsPath, "utf-8")) as {
      theme?: string;
      packages?: unknown[];
      compaction?: { enabled?: boolean; reserveTokens?: number };
    };
    expect(patched.theme).toBe("light");
    expect(patched.packages).toContain("npm:existing-project-package");
    expect(
      patched.packages?.filter((entry) =>
        JSON.stringify(entry).includes("@cortexkit/aft-pi"),
      ),
    ).toHaveLength(1);
    expect(patched.packages).toContain("npm:@cortexkit/pi-magic-context");
    expect(patched.compaction).toEqual({ reserveTokens: 4096, enabled: false });
  });

  it("re-applies Airoucat crew surfaces to the desired template map during trellis update", async () => {
    await init({
      yes: true,
      user: "update-user",
      crew: true,
      profile: "mod",
    } as Parameters<typeof init>[0]);

    const templates = new Map<string, string>([
      [`${DIR_NAMES.WORKFLOW}/config.yaml`, configYamlTemplate],
      [PATHS.WORKFLOW_GUIDE_FILE, workflowMdTemplate],
      [".pi/settings.json", getSettingsTemplate().content],
    ]);

    applyAiroucatUpdateOverlay(tmpDir, templates);

    expect(templates.get(PATHS.WORKFLOW_GUIDE_FILE)).toContain(
      "Airoucat Ambient Intent Router",
    );
    expect(templates.get(`${DIR_NAMES.WORKFLOW}/config.yaml`)).toContain(
      "worker_model:",
    );
    expect(templates.get(".pi/agents/trellis-worker.md")).toContain(
      DEFAULT_AIROUCAT_CREW_MODEL,
    );
    const desiredPiSettings = JSON.parse(
      templates.get(".pi/settings.json") ?? "{}",
    ) as { packages?: string[]; compaction?: { enabled?: boolean } };
    expect(desiredPiSettings.packages).toContain(
      "npm:@cortexkit/pi-magic-context",
    );
    expect(desiredPiSettings.packages).toContain("npm:@cortexkit/aft-pi");
    expect(desiredPiSettings.compaction?.enabled).toBe(false);
  });

  it("rejects an invalid crew model reference", async () => {
    await expect(
      init({
        yes: true,
        crew: true,
        crewModel: "not-a-provider-model",
      } as Parameters<typeof init>[0]),
    ).rejects.toThrow(/Invalid Airoucat crew model/);
  });
});
