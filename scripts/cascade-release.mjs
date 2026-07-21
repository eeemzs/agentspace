#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    if (!raw.startsWith("--")) continue;

    if (raw.includes("=")) {
      const [k, ...rest] = raw.split("=");
      out[k.slice(2)] = rest.join("=");
      continue;
    }

    const key = raw.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
}

function toBool(value, defaultValue = false) {
  if (value == null) return defaultValue;
  if (value === true) return true;
  const v = String(value).trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function parseWorkspacePackageDirs(workspaceDir) {
  const wsPath = path.join(workspaceDir, "pnpm-workspace.yaml");
  if (!fs.existsSync(wsPath)) {
    throw new Error(`pnpm-workspace.yaml bulunamadi: ${wsPath}`);
  }

  const text = fs.readFileSync(wsPath, "utf8");
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*-\s*"?([^"\r\n]+)"?\s*$/);
    if (!m) continue;
    out.push(m[1].trim());
  }
  return out;
}

function buildWorkspaceIndex(workspaceDir) {
  const packageDirs = parseWorkspacePackageDirs(workspaceDir);
  const byName = new Map();
  const byDir = new Map();
  const reverseDeps = new Map();
  const depSections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];

  for (const dir of packageDirs) {
    const pkgPath = path.join(workspaceDir, dir, "package.json");
    if (!fs.existsSync(pkgPath)) continue;
    const json = readJson(pkgPath);
    if (!json.name) continue;

    const info = {
      dir,
      name: String(json.name),
      version: String(json.version || ""),
      packageJsonPath: pkgPath,
      json
    };
    byName.set(info.name, info);
    byDir.set(dir, info);
  }

  for (const info of byName.values()) {
    for (const section of depSections) {
      const deps = info.json[section];
      if (!deps || typeof deps !== "object") continue;

      for (const depName of Object.keys(deps)) {
        if (!byName.has(depName)) continue;
        if (!reverseDeps.has(depName)) reverseDeps.set(depName, new Set());
        reverseDeps.get(depName).add(info.name);
      }
    }
  }

  return { byName, byDir, reverseDeps };
}

function normalizeBump(value, fallback) {
  const bump = String(value || fallback).trim().toLowerCase();
  if (!["patch", "minor", "major"].includes(bump)) {
    throw new Error(`Gecersiz bump degeri: ${value}`);
  }
  return bump;
}

function extractScope(packageName) {
  const m = String(packageName || "").match(/^(@[^/]+)\//);
  return m ? m[1] : "";
}

function resolvePublishScope(args, packageNames) {
  if (args.scope !== true && args.scope !== false) {
    const raw = String(args.scope || "").trim();
    if (raw && raw !== "true" && raw !== "false") {
      return raw.startsWith("@") ? raw : `@${raw}`;
    }
  }

  const scopes = [...new Set(packageNames.map(extractScope).filter(Boolean))];
  if (scopes.length <= 1) return scopes[0] || "";

  throw new Error(
    `Birden fazla scope bulundu (${scopes.join(", ")}). Lutfen --scope ile token scope belirtin.`
  );
}

function resolveRoots(args, index) {
  const raw = String(args.from || args.package || args.packages || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  if (!raw.length) {
    throw new Error("Paket belirtilmedi. --from <dir|@scope/name> veya --packages a,b,c kullanin.");
  }

  const names = [];
  for (const item of raw) {
    if (index.byName.has(item)) {
      names.push(item);
      continue;
    }
    if (index.byDir.has(item)) {
      names.push(index.byDir.get(item).name);
      continue;
    }
    throw new Error(`Workspace paketi bulunamadi: ${item}`);
  }

  return [...new Set(names)];
}

function collectTransitiveDependents(roots, reverseDeps) {
  const queue = [...roots];
  const seen = new Set(roots);
  const dependents = new Set();

  while (queue.length) {
    const current = queue.shift();
    const nexts = reverseDeps.get(current);
    if (!nexts) continue;

    for (const pkg of nexts) {
      if (seen.has(pkg)) continue;
      seen.add(pkg);
      dependents.add(pkg);
      queue.push(pkg);
    }
  }

  return [...dependents].sort();
}

function buildFrontMatter(roots, dependents, rootBump, dependentBump) {
  const lines = ["---"];

  for (const pkg of [...roots].sort()) {
    lines.push(`"${pkg}": ${rootBump}`);
  }
  for (const pkg of dependents) {
    lines.push(`"${pkg}": ${dependentBump}`);
  }

  lines.push("---", "");
  return lines.join("\n");
}

function createChangesetFile(workspaceDir, content, dryRun) {
  const dir = path.join(workspaceDir, ".changeset");
  if (!fs.existsSync(dir) && !dryRun) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const id = `${new Date().toISOString().replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 8)}`;
  const filePath = path.join(dir, `cascade-${id}.md`);
  if (!dryRun) {
    fs.writeFileSync(filePath, content, "utf8");
  }
  return filePath;
}

function buildWithTokenPnpmArgs(scope, pnpmArgs) {
  const out = ["./scripts/with-gpr-token.mjs"];
  if (scope) {
    out.push("--scope", scope);
  }
  out.push("--", "pnpm", ...pnpmArgs);
  return out;
}

function run(command, args, options = {}) {
  const printable = `${command} ${args.join(" ")}`.trim();
  console.log(`>> ${printable}`);
  if (options.dryRun) return;

  const result = spawnSync(command, args, {
    cwd: options.cwd || process.cwd(),
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.error) {
    throw new Error(`Komut calistirilamadi: ${printable} (${result.error.message})`);
  }
  if ((result.status ?? 1) !== 0) {
    throw new Error(`Komut failed: ${printable}`);
  }
}

function printHelp() {
  console.log(`
Cascade release helper (transitive dependents dahil)

Ornek:
  pnpm cascade:changeset -- --from @aopslab/xf-core
  pnpm cascade:changeset -- --from xf-core --root-bump minor --dependent-bump patch
  pnpm cascade:release -- --from @aopslab/xf-core

Options:
  --from <pkg|dir[,pkg2]>     Source package(s), for example @aopslab/xf-core or xf-core
  --root-bump <type>          Source package bump type: patch|minor|major (default: patch)
  --dependent-bump <type>     Dependent package bump type: patch|minor|major (default: patch)
  --release                   Run version/install/build/publish after creating the changeset
  --scope <@scope>            Scope used to select the token (for example @aopslab)
  --registry <url>            Publish registry (default: https://npm.pkg.github.com)
  --access <type>             Publish access (default: restricted)
  --dry-run                   Print the plan without changing files or running commands
  --help
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const workspaceDir = path.resolve(String(args.workspace || process.cwd()));
  const dryRun = toBool(args["dry-run"], false);
  const release = toBool(args.release, false);
  const rootBump = normalizeBump(args["root-bump"], "patch");
  const dependentBump = normalizeBump(args["dependent-bump"], "patch");
  const registry = String(args.registry || "https://npm.pkg.github.com");
  const access = String(args.access || "restricted");

  const index = buildWorkspaceIndex(workspaceDir);
  const roots = resolveRoots(args, index);
  const dependents = collectTransitiveDependents(roots, index.reverseDeps);

  const affected = [...roots, ...dependents];
  const publishScope = resolvePublishScope(args, affected);
  console.log(`Roots      : ${roots.join(", ")}`);
  console.log(`Dependents : ${dependents.length ? dependents.join(", ") : "(yok)"}`);
  console.log(`Affected   : ${affected.length}`);
  if (publishScope) {
    console.log(`Scope      : ${publishScope}`);
  }

  const frontMatter = buildFrontMatter(roots, dependents, rootBump, dependentBump);
  const body = [
    "Cascade release changeset.",
    "",
    `Roots: ${roots.join(", ")}`,
    `Dependents: ${dependents.length ? dependents.join(", ") : "(yok)"}`
  ].join("\n");
  const content = `${frontMatter}${body}\n`;
  const filePath = createChangesetFile(workspaceDir, content, dryRun);
  console.log(dryRun ? `Changeset (dry-run): ${filePath}` : `Changeset yazildi: ${filePath}`);

  if (!release) {
    console.log("\nSonraki adim:");
    console.log("1) pnpm changeset version");
    console.log("2) pnpm install");
    console.log("3) pnpm -r --if-present run build");
    console.log("4) pnpm -r --filter <affected> publish --no-git-checks");
    return;
  }

  run("pnpm", ["changeset", "version"], { cwd: workspaceDir, dryRun });
  run("node", buildWithTokenPnpmArgs(publishScope, ["install"]), { cwd: workspaceDir, dryRun });
  run("pnpm", ["-r", "--if-present", "run", "build"], { cwd: workspaceDir, dryRun });

  const publishArgs = buildWithTokenPnpmArgs(publishScope, ["-r"]);
  for (const pkg of affected) {
    publishArgs.push("--filter", pkg);
  }
  publishArgs.push(
    "publish",
    "--no-git-checks",
    "--access",
    access,
    "--registry",
    registry
  );
  run("node", publishArgs, { cwd: workspaceDir, dryRun });
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
