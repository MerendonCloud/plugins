#!/usr/bin/env node

/**
 * Validates this repo as BOTH a Cursor plugin marketplace and a Claude Code
 * plugin marketplace, plus the editorial rules in docs/PRINCIPLES.md.
 *
 * Structure checks follow cursor/plugin-template's validator; the Claude side
 * follows code.claude.com/docs/en/plugin-marketplaces.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const errors = [];
const warnings = [];

const pluginNamePattern = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
const marketplaceNamePattern = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

// Principle 2: public surface only. Infrastructure and vendor names must not
// appear anywhere in the published catalog. The list is deliberately broad —
// common auth, email, database, cache, hosting, and ORM names across the
// industry — so it lints a category without describing any particular stack.
const DENYLIST = [
  "auth0",
  "aws",
  "azure",
  "clerk",
  "cloudflare",
  "cognito",
  "docker",
  "drizzle",
  "dynamodb",
  "firebase",
  "gcp",
  "ioredis",
  "kubernetes",
  "mailgun",
  "mailpit",
  "memcached",
  "mongodb",
  "mysql",
  "neon",
  "netlify",
  "okta",
  "planetscale",
  "postgres",
  "postmark",
  "prisma",
  "redis",
  "resend",
  "sendgrid",
  "smtp",
  "sqlite",
  "supabase",
  "upstash",
  "valkey",
  "vercel",
];

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile(filePath, context) {
  let raw;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    addError(`${context} is missing: ${path.relative(repoRoot, filePath)}`);
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    addError(`${context} contains invalid JSON (${path.relative(repoRoot, filePath)}): ${error.message}`);
    return null;
  }
}

function parseFrontmatter(content) {
  const normalized = content.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return null;
  const closingIndex = normalized.indexOf("\n---\n", 4);
  if (closingIndex === -1) return null;
  const fields = {};
  for (const line of normalized.slice(4, closingIndex).split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return fields;
}

async function walkFiles(dirPath) {
  const files = [];
  const stack = [dirPath];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(entryPath);
      else if (entry.isFile()) files.push(entryPath);
    }
  }
  return files;
}

async function validateFrontmatterFile(filePath, componentName, requiredKeys, pluginName) {
  const content = await fs.readFile(filePath, "utf8");
  const parsed = parseFrontmatter(content);
  const relativeFile = path.relative(repoRoot, filePath);
  if (!parsed) {
    addError(`${pluginName}: ${componentName} file missing YAML frontmatter: ${relativeFile}`);
    return;
  }
  for (const key of requiredKeys) {
    if (!parsed[key]) {
      addError(`${pluginName}: ${componentName} file missing "${key}" in frontmatter: ${relativeFile}`);
    }
  }
}

async function validateComponents(pluginDir, pluginName) {
  const specs = [
    { dir: "rules", keys: ["description"], exts: [".md", ".mdc", ".markdown"], label: "rule" },
    { dir: "agents", keys: ["name", "description"], exts: [".md", ".mdc", ".markdown"], label: "agent" },
    { dir: "commands", keys: ["name", "description"], exts: [".md", ".mdc", ".markdown", ".txt"], label: "command" },
  ];
  for (const spec of specs) {
    const dir = path.join(pluginDir, spec.dir);
    if (!(await pathExists(dir))) continue;
    for (const file of await walkFiles(dir)) {
      if (spec.exts.includes(path.extname(file).toLowerCase())) {
        await validateFrontmatterFile(file, spec.label, spec.keys, pluginName);
      }
    }
  }
  const skillsDir = path.join(pluginDir, "skills");
  if (await pathExists(skillsDir)) {
    for (const file of await walkFiles(skillsDir)) {
      if (path.basename(file) === "SKILL.md") {
        await validateFrontmatterFile(file, "skill", ["name", "description"], pluginName);
      }
    }
  }
}

function validateMarketplace(marketplace, label) {
  if (!marketplace) return [];
  if (typeof marketplace.name !== "string" || !marketplaceNamePattern.test(marketplace.name)) {
    addError(`${label}: "name" must be lowercase kebab-case.`);
  }
  if (!marketplace.owner || typeof marketplace.owner.name !== "string" || marketplace.owner.name.length === 0) {
    addError(`${label}: "owner.name" is required.`);
  }
  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    addError(`${label}: "plugins" must be a non-empty array.`);
    return [];
  }
  const seen = new Set();
  for (const [index, entry] of marketplace.plugins.entries()) {
    if (!entry || typeof entry !== "object" || typeof entry.name !== "string" || !pluginNamePattern.test(entry.name)) {
      addError(`${label}: plugins[${index}] needs a lowercase kebab-case "name".`);
      continue;
    }
    if (seen.has(entry.name)) addError(`${label}: duplicate plugin "${entry.name}".`);
    seen.add(entry.name);
    if (typeof entry.source !== "string" || !entry.source.startsWith("./")) {
      addError(`${label}: plugins[${index}].source must be a "./" relative path.`);
    }
  }
  return marketplace.plugins.filter((p) => p && typeof p.name === "string");
}

function checkMcpEntries(config, filePath, { requireType }) {
  const relative = path.relative(repoRoot, filePath);
  const servers = config?.mcpServers;
  if (!servers || typeof servers !== "object" || Object.keys(servers).length === 0) {
    addError(`${relative}: "mcpServers" must be a non-empty object.`);
    return {};
  }
  const urls = {};
  for (const [serverName, entry] of Object.entries(servers)) {
    if (typeof entry?.url !== "string" || !entry.url.startsWith("https://")) {
      addError(`${relative}: server "${serverName}" must have an https "url".`);
      continue;
    }
    if (requireType && entry.type !== "http" && entry.type !== "sse") {
      // Claude Code reads an entry with url but no type as a stdio server.
      addError(`${relative}: server "${serverName}" needs "type": "http" (Claude Code format).`);
    }
    for (const forbidden of ["headers", "env", "auth"]) {
      if (entry[forbidden] !== undefined) {
        addError(`${relative}: server "${serverName}" must not carry "${forbidden}" — auth is OAuth discovery, never shipped config.`);
      }
    }
    urls[serverName] = entry.url;
  }
  return urls;
}

async function scanDenylist() {
  const skipDirs = new Set([".git", "scripts", "node_modules"]);
  const stack = [repoRoot];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!skipDirs.has(entry.name)) stack.push(entryPath);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (ext !== "" && ![".md", ".json", ".svg", ".yml", ".yaml", ".txt", ".mdc"].includes(ext)) continue;
      const content = (await fs.readFile(entryPath, "utf8")).toLowerCase();
      for (const term of DENYLIST) {
        // Prefix match on purpose: joined forms like REDIS_URL or PostgreSQL
        // are exactly the shape an internals leak takes.
        if (new RegExp(`\\b${term}`, "i").test(content)) {
          addError(`${path.relative(repoRoot, entryPath)}: mentions "${term}" — internals and providers must not appear in published copy (docs/PRINCIPLES.md §2).`);
        }
      }
    }
  }
}

async function main() {
  const cursorMarketplace = await readJsonFile(
    path.join(repoRoot, ".cursor-plugin", "marketplace.json"),
    "Cursor marketplace manifest",
  );
  const claudeMarketplace = await readJsonFile(
    path.join(repoRoot, ".claude-plugin", "marketplace.json"),
    "Claude marketplace manifest",
  );

  const cursorPlugins = validateMarketplace(cursorMarketplace, "cursor marketplace");
  const claudePlugins = validateMarketplace(claudeMarketplace, "claude marketplace");

  const cursorNames = new Set(cursorPlugins.map((p) => p.name));
  const claudeNames = new Set(claudePlugins.map((p) => p.name));
  for (const name of cursorNames) {
    if (!claudeNames.has(name)) addError(`Plugin "${name}" is in the Cursor catalog but not the Claude catalog.`);
  }
  for (const name of claudeNames) {
    if (!cursorNames.has(name)) addError(`Plugin "${name}" is in the Claude catalog but not the Cursor catalog.`);
  }

  for (const entry of claudePlugins) {
    const pluginDir = path.join(repoRoot, entry.source ?? `./plugins/${entry.name}`);
    if (!(await pathExists(pluginDir))) {
      addError(`${entry.name}: source directory missing: ${entry.source}`);
      continue;
    }

    const cursorManifest = await readJsonFile(
      path.join(pluginDir, ".cursor-plugin", "plugin.json"),
      `${entry.name} Cursor plugin manifest`,
    );
    const claudeManifest = await readJsonFile(
      path.join(pluginDir, ".claude-plugin", "plugin.json"),
      `${entry.name} Claude plugin manifest`,
    );

    for (const [manifest, side] of [
      [cursorManifest, "cursor"],
      [claudeManifest, "claude"],
    ]) {
      if (!manifest) continue;
      if (manifest.name !== entry.name) {
        addError(`${entry.name}: ${side} plugin.json name "${manifest.name}" does not match the catalog entry.`);
      }
      if (!manifest.description) addError(`${entry.name}: ${side} plugin.json needs a description.`);
      if (manifest.author?.name !== "Merendon Cloud") {
        addError(`${entry.name}: ${side} plugin.json author.name must be "Merendon Cloud".`);
      }
    }
    if (cursorManifest && claudeManifest) {
      if (cursorManifest.description !== claudeManifest.description) {
        addError(`${entry.name}: descriptions differ between the Cursor and Claude manifests (PRINCIPLES.md §1).`);
      }
      if (cursorManifest.displayName !== claudeManifest.displayName) {
        addError(`${entry.name}: displayName differs between the Cursor and Claude manifests.`);
      }
    }
    // Catalog blurbs are the first copy a user or model sees; they must not
    // drift from the manifests (PRINCIPLES.md §1).
    if (claudeManifest && entry.description !== claudeManifest.description) {
      addError(`${entry.name}: Claude catalog description differs from its plugin.json description (PRINCIPLES.md §1).`);
    }
    const cursorEntry = cursorPlugins.find((p) => p.name === entry.name);
    if (cursorEntry && cursorManifest && cursorEntry.description !== cursorManifest.description) {
      addError(`${entry.name}: Cursor catalog description differs from its plugin.json description (PRINCIPLES.md §1).`);
    }
    if (cursorManifest && typeof cursorManifest.version !== "string") {
      addError(`${entry.name}: Cursor plugin.json must carry a version (PRINCIPLES.md §4).`);
    }
    if (claudeManifest && claudeManifest.version !== undefined) {
      addError(`${entry.name}: Claude plugin.json must omit "version" so git-SHA auto-updates work (PRINCIPLES.md §4).`);
    }
    if (cursorManifest?.logo && !(await pathExists(path.join(pluginDir, cursorManifest.logo)))) {
      addError(`${entry.name}: logo path "${cursorManifest.logo}" is missing.`);
    }

    const claudeMcp = await readJsonFile(path.join(pluginDir, ".mcp.json"), `${entry.name} .mcp.json`);
    const cursorMcp = await readJsonFile(path.join(pluginDir, "mcp.json"), `${entry.name} mcp.json`);
    const claudeUrls = claudeMcp ? checkMcpEntries(claudeMcp, path.join(pluginDir, ".mcp.json"), { requireType: true }) : {};
    const cursorUrls = cursorMcp ? checkMcpEntries(cursorMcp, path.join(pluginDir, "mcp.json"), { requireType: false }) : {};
    const serverNames = new Set([...Object.keys(claudeUrls), ...Object.keys(cursorUrls)]);
    for (const serverName of serverNames) {
      if (claudeUrls[serverName] !== cursorUrls[serverName]) {
        addError(`${entry.name}: MCP url for "${serverName}" differs between .mcp.json and mcp.json.`);
      }
    }

    await validateComponents(pluginDir, entry.name);
  }

  await scanDenylist();

  if (warnings.length > 0) {
    console.log("Warnings:");
    for (const warning of warnings) console.log(`- ${warning}`);
    console.log("");
  }
  if (errors.length > 0) {
    console.error("Validation failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`Validation passed: ${claudePlugins.length} plugins, both catalogs in sync.`);
}

await main();
