#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const KNOWN_SCOPE_ENV_KEYS = {
  "@aopslab": "PAC_GITHUB_AOPSLAB",
  "@sonmicro": "PAC_GITHUB_SONMICRO",
  "@eeemzs": "PAC_GITHUB_EEEMZS"
};

function parseCli(argv) {
  const sepIndex = argv.indexOf("--");
  const optionArgs = sepIndex >= 0 ? argv.slice(0, sepIndex) : argv;
  const command = sepIndex >= 0 ? argv.slice(sepIndex + 1) : [];

  const options = {};
  for (let i = 0; i < optionArgs.length; i += 1) {
    const raw = optionArgs[i];
    if (!raw.startsWith("--")) continue;

    if (raw.includes("=")) {
      const [k, ...rest] = raw.split("=");
      options[k.slice(2)] = rest.join("=");
      continue;
    }

    const key = raw.slice(2);
    const next = optionArgs[i + 1];
    if (!next || next.startsWith("--")) {
      options[key] = true;
      continue;
    }
    options[key] = next;
    i += 1;
  }

  return { options, command };
}

function toBool(value, defaultValue = false) {
  if (value == null) return defaultValue;
  if (value === true) return true;
  const v = String(value).trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function stripQuotes(value) {
  return String(value ?? "").trim().replace(/^['"]|['"]$/g, "");
}

function normalizeScope(scope) {
  if (scope === true || scope === false) return "";
  if (!scope) return "";
  const raw = String(scope).trim();
  if (raw === "true" || raw === "false") return "";
  if (!raw) return "";
  return raw.startsWith("@") ? raw : `@${raw}`;
}

function scopeToEnvKey(scope) {
  const clean = String(scope || "")
    .replace(/^@/, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .toUpperCase()
    .replace(/^_+|_+$/g, "");

  return clean ? `PAC_GITHUB_${clean}` : "";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  const text = fs.readFileSync(filePath, "utf8");

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;

    const key = trimmed.slice(0, idx).trim();
    const value = stripQuotes(trimmed.slice(idx + 1));
    out[key] = value;
  }
  return out;
}

function readWindowsPersistentEnv(name, target) {
  const ps = [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    `[Environment]::GetEnvironmentVariable('${name}','${target}')`
  ];
  const result = spawnSync("powershell", ps, {
    encoding: "utf8",
    stdio: "pipe"
  });
  if ((result.status ?? 1) !== 0) return "";
  return stripQuotes(result.stdout);
}

function readEnvValue(varName, envFileMap) {
  const fromProcess = stripQuotes(process.env[varName] || "");
  if (fromProcess) {
    return { value: fromProcess, source: `${varName} (process)` };
  }

  if (process.platform === "win32") {
    const fromUser = readWindowsPersistentEnv(varName, "User");
    if (fromUser) {
      return { value: fromUser, source: `${varName} (windows:user)` };
    }

    const fromMachine = readWindowsPersistentEnv(varName, "Machine");
    if (fromMachine) {
      return { value: fromMachine, source: `${varName} (windows:machine)` };
    }
  }

  const fromEnvFile = stripQuotes(envFileMap[varName] || "");
  if (fromEnvFile) {
    return { value: fromEnvFile, source: `${varName} (.env)` };
  }

  return null;
}

function resolveToken({ workspaceDir, scope, explicitToken }) {
  const envPath = path.join(workspaceDir, ".env");
  const envFileMap = parseDotEnv(envPath);

  const directToken = stripQuotes(explicitToken || "");
  if (directToken) {
    return { token: directToken, source: "--token" };
  }

  const normalizedScope = normalizeScope(scope);
  const envCandidates = unique([
    normalizedScope ? KNOWN_SCOPE_ENV_KEYS[normalizedScope] : "",
    normalizedScope ? scopeToEnvKey(normalizedScope) : "",
    "PAC_GITHUB_DEFAULT",
    "NODE_AUTH_TOKEN",
    "GH_PACKAGES_TOKEN"
  ]);

  for (const key of envCandidates) {
    const resolved = readEnvValue(key, envFileMap);
    if (resolved?.value) {
      return { token: resolved.value, source: resolved.source };
    }
  }

  throw new Error(
    [
      "GitHub Packages token bulunamadi.",
      `Scope: ${normalizedScope || "(belirtilmedi)"}`,
      `Aranan env keyler: ${envCandidates.join(", ")}`,
      "Cozum: OS env'e ekleyin (veya fallback icin .env dosyasina yazin)."
    ].join("\n")
  );
}

function createTempUserConfig(scope, token) {
  const lines = [
    "registry=https://registry.npmjs.org/",
    "always-auth=true",
    `//npm.pkg.github.com/:_authToken=${token}`
  ];

  if (scope) {
    lines.push(`${scope}:registry=https://npm.pkg.github.com`);
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "with-gpr-token-"));
  const filePath = path.join(dir, ".npmrc");
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`, { encoding: "utf8", mode: 0o600 });
  return { dir, filePath };
}

function cleanupTempUserConfig(tempConfig) {
  if (!tempConfig?.filePath) return;
  try {
    fs.rmSync(tempConfig.dir, { recursive: true, force: true });
  } catch {}
}

function runCommand(command, cwd, env, dryRun, tempConfig) {
  const printable = command.join(" ");
  console.log(`>> ${printable}`);
  if (dryRun) return;

  const [cmd, ...args] = command;
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env,
    shell: process.platform === "win32"
  });

  cleanupTempUserConfig(tempConfig);

  if (result.error) {
    throw new Error(`Komut calistirilamadi: ${printable} (${result.error.message})`);
  }
  if ((result.status ?? 1) !== 0) {
    throw new Error(`Komut basarisiz: ${printable}`);
  }
}

function printHelp() {
  console.log(`
with-gpr-token.mjs

Amac:
  Scope'a gore token cozer ve komutu GH/NODE auth env ile calistirir.

Kullanim:
  node ./scripts/with-gpr-token.mjs --scope @aopslab -- pnpm -r publish --no-git-checks
  node ./scripts/with-gpr-token.mjs --scope @sonmicro -- npm whoami --registry https://npm.pkg.github.com

Opsiyonlar:
  --scope <@scope>    Token secim scope'u (ornek: @aopslab)
  --token <value>     Dogrudan token (opsiyonel)
  --workspace <dir>   Varsayilan: mevcut dizin
  --dry-run           Komutu calistirmadan plani yazdirir
  --quiet             Token kaynak logunu basmaz
  --help

Desteklenen keyler:
  PAC_GITHUB_AOPSLAB
  PAC_GITHUB_SONMICRO
  PAC_GITHUB_EEEMZS
  PAC_GITHUB_DEFAULT
  NODE_AUTH_TOKEN
  GH_PACKAGES_TOKEN
`);
}

function main() {
  const { options, command } = parseCli(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  if (!command.length) {
    throw new Error("Calistirilacak komut verilmedi. '-- <komut>' formunu kullanin.");
  }

  const workspaceDir = path.resolve(String(options.workspace || process.cwd()));
  const scope = normalizeScope(options.scope || process.env.PAC_GITHUB_SCOPE || "");
  const dryRun = toBool(options["dry-run"], false);
  const quiet = toBool(options.quiet, false);

  const { token, source } = resolveToken({
    workspaceDir,
    scope,
    explicitToken: options.token
  });

  const env = {
    ...process.env,
    PAC_GITHUB_DEFAULT: token,
    GH_PACKAGES_TOKEN: token,
    NODE_AUTH_TOKEN: token
  };
  if (scope) {
    env[scopeToEnvKey(scope)] = token;
    if (KNOWN_SCOPE_ENV_KEYS[scope]) {
      env[KNOWN_SCOPE_ENV_KEYS[scope]] = token;
    }
  }

  const tempConfig = createTempUserConfig(scope, token);
  env.NPM_CONFIG_USERCONFIG = tempConfig.filePath;
  env.npm_config_userconfig = tempConfig.filePath;

  if (!quiet) {
    console.log(`Token source: ${source}`);
    if (scope) {
      console.log(`Scope       : ${scope}`);
    }
  }

  runCommand(command, workspaceDir, env, dryRun, tempConfig);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
