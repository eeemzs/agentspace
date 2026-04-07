#!/usr/bin/env node

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tempRootDefault = process.env.TMPDIR || os.tmpdir()
const installScopeDefault = '@aopslab'
const defaultWorkspaceOwnerId = '11111111-1111-4111-8111-111111111111'

const internalPackages = [
  { dir: 'agentspace-core', name: '@aopslab/domain-core-agentspace' },
  { dir: 'agentspace-dm', name: '@aopslab/domain-dm-agentspace' },
  { dir: 'agentspace-kit', name: '@aopslab/domain-kit-agentspace' },
  { dir: 'agentspace-ops', name: '@aopslab/domain-ops-agentspace' },
  { dir: 'agentspace-tooling', name: '@aopslab/domain-tooling-agentspace' },
  { dir: 'agentspace-host-plugin', name: '@aopslab/domain-host-plugin-agentspace' },
  { dir: 'agentspace-cli', name: '@aopslab/domain-cli-agentspace' },
]

function printUsage() {
  process.stdout.write(
    [
      'agentspace packaged CLI smoke',
      '',
      'Purpose:',
      '  Packs the local agentspace publish closure, installs it into an isolated temp app,',
      '  resolves transitive private packages through with-gpr-token, and exercises the',
      '  installed `agentspace` bin against default or explicit repository URLs.',
      '',
      'Usage:',
      '  node ./scripts/agentspace-cli-packed-smoke.mjs [--repo-url <url>] [--skip-build] [--keep-temp] [--temp-root <dir>] [--scope <@scope>]',
      '',
      'Options:',
      '  --repo-url <url>   Explicit repo URL. If omitted, installed agentspace defaults to ~/.aops/agentspace.aops.sqlite.',
      '  --skip-build       Skip package rebuild before pack/install.',
      '  --keep-temp        Keep temp run root even on success.',
      '  --temp-root <dir>  Parent temp directory (default: $TMPDIR or system temp).',
      '  --scope <@scope>   Scope passed to with-gpr-token (default: @aopslab).',
      '  --help             Show this help.',
      '',
      'Examples:',
      '  pnpm run smoke:packed-install',
      '  pnpm run smoke:packed-install -- --repo-url postgresql://user:pass@host:5432/agentspace_dev',
      '',
    ].join('\n'),
  )
}

function parseArgs(argv) {
  const options = {
    repoUrl: '',
    skipBuild: false,
    keepTemp: false,
    tempRoot: tempRootDefault,
    scope: installScopeDefault,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--') continue
    if (token === '--help') {
      printUsage()
      process.exit(0)
    }
    if (token === '--skip-build') {
      options.skipBuild = true
      continue
    }
    if (token === '--keep-temp') {
      options.keepTemp = true
      continue
    }
    if (token === '--repo-url') {
      options.repoUrl = String(argv[index + 1] ?? '').trim()
      index += 1
      continue
    }
    if (token === '--temp-root') {
      options.tempRoot = String(argv[index + 1] ?? '').trim() || tempRootDefault
      index += 1
      continue
    }
    if (token === '--scope') {
      options.scope = String(argv[index + 1] ?? '').trim() || installScopeDefault
      index += 1
      continue
    }
    throw new Error(`unknown_option:${token}`)
  }

  return options
}

function log(message) {
  process.stdout.write(`[agentspace-cli-smoke] ${message}\n`)
}

function fail(message) {
  throw new Error(`[agentspace-cli-smoke] FAIL: ${message}`)
}

function normalizeRepoUrl(repoUrl) {
  return String(repoUrl ?? '').trim().replace(/(?:\\r|\r)+$/g, '')
}

function inferRepoDialect(repoUrl) {
  const normalized = normalizeRepoUrl(repoUrl).toLowerCase()
  if (!normalized) return 'sqlite'
  if (normalized === ':memory:') return 'sqlite'
  if (normalized.startsWith('sqlite:') || normalized.startsWith('file:')) return 'sqlite'
  if (normalized.endsWith('.db') || normalized.endsWith('.sqlite') || normalized.endsWith('.sqlite3')) return 'sqlite'
  return 'pg'
}

function resolveSqliteFilename(repoUrl) {
  const trimmed = normalizeRepoUrl(repoUrl)
  if (trimmed === ':memory:') return ':memory:'

  const stripScheme = (value, scheme) =>
    value.startsWith(scheme) ? value.slice(scheme.length).replace(/^\/\//, '') : value

  const noSqlite = stripScheme(trimmed, 'sqlite:')
  const noFile = stripScheme(noSqlite, 'file:')
  return noFile || trimmed
}

function run(command, args, options = {}) {
  const {
    cwd = rootDir,
    env = process.env,
    capture = false,
    quiet = false,
  } = options

  const printable = `${command} ${args.join(' ')}`
  if (!quiet) {
    log(`run: ${printable}`)
  }

  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.error) {
    fail(`command_spawn_failed:${printable}:${result.error.message}`)
  }
  if ((result.status ?? 1) !== 0) {
    const output = capture ? [result.stdout?.trim(), result.stderr?.trim()].filter(Boolean).join('\n') : ''
    fail(`command_failed:${printable}${output ? `\n${output}` : ''}`)
  }

  return {
    stdout: capture ? String(result.stdout ?? '') : '',
    stderr: capture ? String(result.stderr ?? '') : '',
  }
}

function ensureCommand(command) {
  const probe = spawnSync(command, ['--version'], {
    encoding: 'utf8',
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })
  if (probe.error) {
    fail(`missing_required_command:${command}`)
  }
}

function readPackageDescriptor(packageDir) {
  return JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'))
}

function packPackage(packageDir, packDir) {
  const pkg = readPackageDescriptor(packageDir)
  const tarballName = `${pkg.name.replace(/^@/, '').replace(/\//g, '-')}-${pkg.version}.tgz`
  const tarballPath = path.join(packDir, tarballName)
  run('pnpm', ['pack', '--out', tarballPath], { cwd: packageDir, capture: true, quiet: true })
  return { name: pkg.name, tarballPath }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function parseJsonOutput(raw, label) {
  try {
    return JSON.parse(raw)
  } catch (error) {
    fail(`invalid_json_output:${label}:${error instanceof Error ? error.message : String(error)}`)
  }
}

function toItems(value) {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []
  const record = value
  if (Array.isArray(record.items)) return record.items
  if (Array.isArray(record.data)) return record.data
  if (record.data && typeof record.data === 'object' && Array.isArray(record.data.items)) {
    return record.data.items
  }
  return []
}

function assert(condition, message) {
  if (!condition) {
    fail(message)
  }
}

function assertFileContains(filePath, needle) {
  const content = fs.readFileSync(filePath, 'utf8')
  assert(content.includes(needle), `expected_text_missing:${needle}:${filePath}`)
}

function createTempRunRoot(tempRoot) {
  fs.mkdirSync(tempRoot, { recursive: true })
  return fs.mkdtempSync(path.join(tempRoot, 'agentspace-cli-smoke.'))
}

function buildInstallAppPackageJson(overrides) {
  return {
    name: 'agentspace-cli-packaged-smoke',
    private: true,
    type: 'module',
    pnpm: {
      onlyBuiltDependencies: ['better-sqlite3'],
      overrides,
    },
  }
}

function buildIsolatedEnv(homeDir) {
  return {
    ...process.env,
    HOME: homeDir,
    USERPROFILE: homeDir,
    DOTENV_CONFIG_QUIET: 'true',
    NODE_NO_WARNINGS: '1',
    AGENTSPACE_REPO_URL: '',
    AGENTSPACE_PG_URL: '',
    AGENTSPACE_SQLITE_URL: '',
    AGENTSPACE_WORKSPACE_ID: '',
    AGENTSPACE_CLI_EXECUTION_MODE: '',
    AGENTSPACE_CLI_HOST_CONFIG_PATH: '',
    HOST_NODE_CONFIG: '',
    TENANT_ID: '',
    LOG_LEVEL: '',
    AOPS_PG_URL: '',
    DEV_PG_URL: '',
    AOPS_CLI_CONFIG_PATH: '',
    AGENT_OPS_CONFIG_PATH: '',
  }
}

function createRunner(cliBin, installAppDir, responsesDir, env, runtimeRepoUrl) {
  const appendRuntimeRepoArgs = (args) =>
    runtimeRepoUrl ? [...args, '--repo-url', runtimeRepoUrl] : args

  function runAgentspace(name, args, mode = 'json', options = {}) {
    const suffix = mode === 'json' ? 'json' : 'txt'
    const outputPath = path.join(responsesDir, `${name}.${suffix}`)
    const finalArgs = options.runtime === true ? appendRuntimeRepoArgs(args) : args
    const { stdout } = run(cliBin, finalArgs, {
      cwd: installAppDir,
      env,
      capture: true,
      quiet: true,
    })
    fs.writeFileSync(outputPath, stdout, 'utf8')

    if (mode === 'text') {
      return { outputPath, text: stdout }
    }

    return {
      outputPath,
      json: parseJsonOutput(stdout, name),
    }
  }

  return {
    runStatic(name, args, mode = 'json') {
      return runAgentspace(name, args, mode, { runtime: false })
    },
    runRuntime(name, args, mode = 'json') {
      return runAgentspace(name, args, mode, { runtime: true })
    },
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  ensureCommand('pnpm')

  let runRoot = ''
  let runStatus = 'failed'
  let createdProjectId = ''
  let cleanupRunner = null

  try {
    if (!options.skipBuild) {
      for (const script of ['build:core', 'build:dm', 'build:kit', 'build:ops', 'build:tooling', 'build:host-plugin', 'build:cli']) {
        run('pnpm', ['run', script], { cwd: rootDir })
      }
    }

    runRoot = createTempRunRoot(path.resolve(options.tempRoot))
    const packsDir = path.join(runRoot, 'packs')
    const installAppDir = path.join(runRoot, 'app')
    const homeDir = path.join(runRoot, 'home')
    const responsesDir = path.join(runRoot, 'responses')

    fs.mkdirSync(packsDir, { recursive: true })
    fs.mkdirSync(installAppDir, { recursive: true })
    fs.mkdirSync(homeDir, { recursive: true })
    fs.mkdirSync(responsesDir, { recursive: true })

    const defaultHomeSqlitePath = path.join(homeDir, '.aops', 'agentspace.aops.sqlite')
    const defaultHomeSqliteRepoUrl = `file:${defaultHomeSqlitePath.replaceAll('\\', '/')}`
    const runtimeRepoUrl = normalizeRepoUrl(options.repoUrl) || ''
    const effectiveRepoUrl = runtimeRepoUrl || defaultHomeSqliteRepoUrl
    const repoDialect = inferRepoDialect(effectiveRepoUrl)
    if (repoDialect === 'sqlite' && resolveSqliteFilename(effectiveRepoUrl) === ':memory:') {
      fail('sqlite_memory_repo_not_supported:use_file_url_or_omit_repo_url')
    }

    log(`temp root: ${runRoot}`)
    log(`repo url: ${effectiveRepoUrl}`)

    const tarballs = new Map()
    for (const pkg of internalPackages) {
      const packed = packPackage(path.join(rootDir, pkg.dir), packsDir)
      tarballs.set(packed.name, packed.tarballPath)
    }

    const overrides = Object.fromEntries(
      [...tarballs.entries()].map(([packageName, tarballPath]) => [packageName, `file:${tarballPath}`]),
    )
    writeJson(path.join(installAppDir, 'package.json'), buildInstallAppPackageJson(overrides))

    const cliTarball = tarballs.get('@aopslab/domain-cli-agentspace')
    assert(Boolean(cliTarball), 'missing_cli_tarball')

    run(
      'node',
      [
        path.join(rootDir, 'scripts', 'with-gpr-token.mjs'),
        '--scope',
        options.scope,
        '--workspace',
        installAppDir,
        '--',
        'pnpm',
        'add',
        cliTarball,
      ],
      { cwd: rootDir },
    )

    const cliBin = path.join(
      installAppDir,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'agentspace.cmd' : 'agentspace',
    )
    assert(fs.existsSync(cliBin), `installed_cli_not_found:${cliBin}`)
    log(`installed cli: ${cliBin}`)

    const cliVersion = String(readPackageDescriptor(path.join(rootDir, 'agentspace-cli')).version ?? '0.0.0')
    const isolatedEnv = buildIsolatedEnv(homeDir)
    const runner = createRunner(cliBin, installAppDir, responsesDir, isolatedEnv, runtimeRepoUrl)
    cleanupRunner = runner

    const version = runner.runStatic('version', ['--version'], 'text')
    assert(version.text.trim() === cliVersion, 'cli_version_mismatch')

    const help = runner.runStatic('help', ['--help'], 'text')
    assertFileContains(help.outputPath, 'agentspace manifest cli')

    const projectHelp = runner.runStatic('project-list-help', ['project', 'list-projects', '--help'], 'text')
    assertFileContains(projectHelp.outputPath, 'Generated from Agentspace DCM docs, shared contract args/examples, and host route projection.')

    const cliManifestKind = runner.runStatic(
      'manifest-get-cli-kind',
      ['manifest', 'get', 'cli', '--path', 'kind'],
    ).json
    assert(String(cliManifestKind ?? '') === 'agentspace-cli-projection', 'cli_manifest_kind_mismatch')

    const dcmGet = runner.runStatic(
      'manifest-get-dcm-project-list',
      ['manifest', 'get', 'dcm', '--path', 'docs.operations.project.list-projects'],
    ).json
    assert(String(dcmGet.summary ?? '').includes('Project'), 'dcm_manifest_project_list_summary_missing')

    const cliGet = runner.runStatic(
      'manifest-get-cli-project-list',
      ['manifest', 'get', 'cli', '--path', 'commandsById.project.list-projects'],
    ).json
    assert(String(cliGet.title ?? '') === 'agentspace project list-projects', 'cli_manifest_project_list_title_mismatch')

    const hrmShow = runner.runStatic('manifest-show-hrm', ['manifest', 'show', 'hrm'], 'text')
    assertFileContains(hrmShow.outputPath, 'runtime registration metadata only')

    const hostRegistration = runner.runStatic('manifest-host-registration', ['manifest', 'host-registration']).json
    assert(String(hostRegistration.domainId ?? '') === 'agentspace', 'host_registration_domain_mismatch')
    assert(String(hostRegistration.packageName ?? '') === '@aopslab/domain-cli-agentspace', 'host_registration_package_mismatch')
    assert(String(hostRegistration.binary ?? '') === 'agentspace', 'host_registration_binary_mismatch')
    assert(
      Array.isArray(hostRegistration.routes) &&
        hostRegistration.routes.some((route) => String(route?.id ?? '') === 'agentspace.project.list-projects'),
      'host_registration_routes_missing_project_list',
    )

    assert(fs.existsSync(defaultHomeSqlitePath) === false, 'default_sqlite_should_not_preexist')

    const listedDefault = runner.runRuntime('project-list-default', ['project', 'list-projects']).json
    assert(Array.isArray(listedDefault), 'project_list_default_should_return_array')

    if (repoDialect === 'sqlite') {
      const sqliteFilename = resolveSqliteFilename(effectiveRepoUrl)
      assert(fs.existsSync(sqliteFilename), `sqlite_repo_missing_file:${sqliteFilename}`)
    }

    const projectName = `Agentspace Smoke Project ${Date.now()}`
    const createdProject = runner.runRuntime(
      'project-create',
      [
        'project',
        'create',
        '--data',
        JSON.stringify({
          name: projectName,
        }),
      ],
    ).json
    createdProjectId = String(createdProject.id ?? createdProject.data?.id ?? '')
    assert(createdProjectId.length > 0, 'project_create_missing_id')

    const listedProject = runner.runRuntime(
      'project-list-created',
      ['project', 'list-projects', '--filter', JSON.stringify({ id: createdProjectId })],
    ).json
    assert(
      toItems(listedProject).some((item) => String(item.id ?? '') === createdProjectId),
      'project_list_missing_created_record',
    )

    runner.runRuntime('project-delete', ['project', 'remove-project', '--id', createdProjectId])
    const deletedProjectId = createdProjectId
    createdProjectId = ''

    const listedProjectAfterDelete = runner.runRuntime(
      'project-list-after-delete',
      ['project', 'list-projects', '--filter', JSON.stringify({ id: deletedProjectId })],
    ).json
    assert(toItems(listedProjectAfterDelete).length === 0, 'project_delete_did_not_remove_record')

    runStatus = 'passed'
    log('packaged CLI smoke passed')
  } finally {
    if (cleanupRunner && createdProjectId) {
      try {
        cleanupRunner.runRuntime('cleanup-project-delete', ['project', 'remove-project', '--id', createdProjectId])
      } catch {}
    }

    if (!runRoot) return

    if (runStatus === 'passed' && !options.keepTemp) {
      fs.rmSync(runRoot, { recursive: true, force: true })
      log('cleaned temp root')
      return
    }

    log(`kept temp root: ${runRoot}`)
  }
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
