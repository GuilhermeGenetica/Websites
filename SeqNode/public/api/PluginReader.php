<?php

declare(strict_types=1);

/**
 * PluginReader — Reads YAML plugin files from the local plugins/ directory.
 *
 * Serves GET /api/plugins and related routes directly from Hostinger's filesystem,
 * removing the dependency on the VPS for the plugin sidebar AND properties panel.
 *
 * Returns the FULL plugin structure (params, inputs, outputs, install, command, tags)
 * matching the format produced by the Python Pydantic PluginManifest.model_dump().
 *
 * Parsing strategy:
 *   1. Uses PHP yaml_parse() extension if available (preferred).
 *   2. Falls back to a structured section parser that handles:
 *      - Top-level scalars  (name, id, version, description, …)
 *      - Block scalars      (> and | multiline strings)
 *      - Inline lists       (tags: [a, b, c])
 *      - Top-level sections with 2-level nesting (params:, inputs:, outputs:, install:)
 */
class PluginReader
{
    /** Absolute path to the plugins/ folder (sibling of api/ inside public_html). */
    private static function dir(): string
    {
        return dirname(__DIR__) . '/plugins';
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Public API
    // ──────────────────────────────────────────────────────────────────────────

    /** Return all plugins as a fully-hydrated array (params, inputs, outputs included). */
    public static function listPlugins(?string $category = null, ?string $search = null): array
    {
        $dir = self::dir();
        if (!is_dir($dir)) return [];

        $plugins = [];
        $files   = glob($dir . '/*.{yaml,yml}', GLOB_BRACE) ?: [];

        foreach ($files as $file) {
            $content = @file_get_contents($file);
            if ($content === false) continue;

            $plugin = self::parsePlugin($content);
            if (empty($plugin['id'])) continue;

            $plugin['filename'] = basename($file);

            if ($category && strtolower($plugin['category']) !== strtolower($category)) continue;
            if ($search) {
                $q = strtolower($search);
                if (
                    !str_contains(strtolower($plugin['name']),        $q) &&
                    !str_contains(strtolower($plugin['id']),          $q) &&
                    !str_contains(strtolower($plugin['description']), $q)
                ) continue;
            }

            $plugins[] = $plugin;
        }

        usort($plugins, fn($a, $b) =>
            strcmp($a['category'], $b['category']) ?: strcmp($a['name'], $b['name'])
        );

        return $plugins;
    }

    /** Return sorted unique list of category names. */
    public static function listCategories(): array
    {
        $cats = array_unique(array_column(self::listPlugins(), 'category'));
        sort($cats);
        return array_values($cats);
    }

    /** Return raw YAML content of a plugin by id. */
    public static function getRaw(string $id): ?array
    {
        $dir   = self::dir();
        $files = glob($dir . '/*.{yaml,yml}', GLOB_BRACE) ?: [];

        foreach ($files as $file) {
            $content = @file_get_contents($file);
            if ($content === false) continue;
            $p = self::parsePlugin($content);
            if (($p['id'] ?? '') === $id) {
                return ['filename' => basename($file), 'content' => $content, 'offline' => false];
            }
        }
        return null;
    }

    /** Save a YAML file (admin only). */
    public static function saveRaw(string $filename, string $content): bool
    {
        $dir  = self::dir();
        $path = $dir . '/' . basename($filename);
        return (bool) @file_put_contents($path, $content);
    }

    /** Delete a plugin YAML file (admin only). */
    public static function deleteRaw(string $id): bool
    {
        $dir   = self::dir();
        $files = glob($dir . '/*.{yaml,yml}', GLOB_BRACE) ?: [];
        foreach ($files as $file) {
            $content = @file_get_contents($file);
            if ($content === false) continue;
            $p = self::parsePlugin($content);
            if (($p['id'] ?? '') === $id) return @unlink($file);
        }
        return false;
    }

    /** Return a minimal YAML template for creating a new plugin. */
    public static function getTemplate(): string
    {
        return <<<'YAML'
id: "new_tool"
name: "New Tool"
category: "General"
version: "1.0"
description: "Short description of what this tool does."
author: ""

install:
  method: system
  binary: new_tool
  version_check: "new_tool --version"
  default_paths:
    bin_path: ""

params:
  threads:
    type: int
    label: "Threads"
    default: 4
    min: 1
    max: 128
    category: "Performance"

inputs:
  input_file:
    type: file
    extensions: []
    label: "Input File"
    required: true

outputs:
  output_file:
    type: file
    extensions: []
    label: "Output File"
    required: false

command:
  template: "new_tool --threads {threads} --input {input_file} --output {output_file}"
  shell: "/bin/bash"
YAML;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Core parser — public for diagnostic use
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Parse one YAML plugin file into a fully-hydrated array.
     *
     * Priority:
     *   1. yaml_parse() if the PHP YAML extension is loaded.
     *   2. Structured fallback parser (handles our specific YAML grammar).
     */
    public static function parsePlugin(string $content): array
    {
        // ── Strategy 1: native PHP YAML extension ──────────────────────────
        if (function_exists('yaml_parse')) {
            $raw = @yaml_parse($content);
            if (is_array($raw) && !empty($raw['id'])) {
                return self::normalizePlugin($raw);
            }
        }

        // ── Strategy 2: structured fallback parser ──────────────────────────
        return self::parseFallback($content);
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Normalise a raw PHP-parsed array into the expected frontend schema
    // ──────────────────────────────────────────────────────────────────────────

    private static function normalizePlugin(array $raw): array
    {
        $params  = self::normalizeParams((array)($raw['params']  ?? []));
        $inputs  = self::normalizeIoPorts((array)($raw['inputs']  ?? []), true);
        $outputs = self::normalizeIoPorts((array)($raw['outputs'] ?? []), false);
        $install = self::normalizeInstall($raw['install'] ?? null);
        $command = self::normalizeCommand($raw['command'] ?? '');
        $runtime = self::normalizeRuntime($raw['runtime'] ?? []);

        return [
            'id'          => (string)($raw['id']          ?? ''),
            'name'        => (string)($raw['name']         ?? ''),
            'version'     => (string)($raw['version']      ?? '1.0.0'),
            'category'    => (string)($raw['category']     ?? 'General'),
            'description' => trim((string)($raw['description'] ?? '')),
            'author'      => (string)($raw['author']       ?? ''),
            'license'     => (string)($raw['license']      ?? 'MIT'),
            'tags'        => is_array($raw['tags'] ?? null) ? array_values((array)$raw['tags']) : [],
            'command'     => $command,
            'runtime'     => $runtime,
            'params'      => $params,
            'inputs'      => $inputs,
            'outputs'     => $outputs,
            'install'     => $install,
        ];
    }

    private static function normalizeParams(array $raw): array
    {
        $out = [];
        foreach ($raw as $key => $p) {
            if (!is_array($p)) continue;
            $choices = null;
            if (isset($p['choices']) && is_array($p['choices'])) {
                $choices = array_map('strval', $p['choices']);
            }
            $out[(string)$key] = [
                'type'        => (string)($p['type']         ?? 'string'),
                'label'       => (string)($p['label']        ?? $key),
                'description' => trim((string)($p['description'] ?? '')),
                'default'     => $p['default']   ?? null,
                'min'         => isset($p['min'])  ? (float)$p['min']  : null,
                'max'         => isset($p['max'])  ? (float)$p['max']  : null,
                'choices'     => $choices,
                'required'    => (bool)($p['required']  ?? false),
                'category'    => (string)($p['category'] ?? 'General'),
                'visible'     => isset($p['visible'])  ? (bool)$p['visible']  : true,
                'advanced'    => (bool)($p['advanced']  ?? false),
                'extension'   => isset($p['extension'])  ? (array)$p['extension']  : null,
                'extensions'  => isset($p['extensions']) ? (array)$p['extensions'] : null,
            ];
        }
        return $out;
    }

    private static function normalizeIoPorts(array $raw, bool $defaultRequired): array
    {
        $out = [];
        foreach ($raw as $key => $port) {
            if (!is_array($port)) continue;
            $out[(string)$key] = [
                'type'          => (string)($port['type']         ?? 'file'),
                'extensions'    => isset($port['extensions']) ? array_values((array)$port['extensions']) : [],
                'label'         => (string)($port['label']        ?? $key),
                'description'   => trim((string)($port['description'] ?? '')),
                'required'      => (bool)($port['required']  ?? $defaultRequired),
                'multiple'      => (bool)($port['multiple']  ?? false),
                'from_template' => $port['from_template'] ?? null,
            ];
        }
        return $out;
    }

    private static function normalizeInstall($raw): ?array
    {
        if (empty($raw) || !is_array($raw)) return null;
        return [
            'method'          => (string)($raw['method']         ?? 'conda'),
            'binary'          => isset($raw['binary'])          ? (string)$raw['binary'] : null,
            'version_check'   => isset($raw['version_check'])   ? (string)$raw['version_check'] : null,
            'conda_env'       => isset($raw['conda_env'])       ? (string)$raw['conda_env'] : null,
            'conda_package'   => isset($raw['conda_package'])   ? (string)$raw['conda_package'] : null,
            'pip_package'     => isset($raw['pip_package'])     ? (string)$raw['pip_package'] : null,
            'size_estimate'   => isset($raw['size_estimate'])   ? (string)$raw['size_estimate'] : null,
            'docs_url'        => isset($raw['docs_url'])        ? (string)$raw['docs_url'] : null,
            'notes'           => isset($raw['notes'])           ? trim((string)$raw['notes']) : null,
            'default_paths'   => is_array($raw['default_paths'] ?? null) ? (array)$raw['default_paths'] : [],
            'conda_channels'  => is_array($raw['conda_channels'] ?? null) ? array_values((array)$raw['conda_channels']) : [],
            'post_install'    => isset($raw['post_install'])    ? (string)$raw['post_install'] : null,
        ];
    }

    private static function normalizeCommand($raw): mixed
    {
        if (is_string($raw)) return $raw;
        if (!is_array($raw)) return '';
        return [
            'template'      => (string)($raw['template']       ?? ''),
            'shell'         => (string)($raw['shell']          ?? '/bin/bash'),
            'working_dir'   => isset($raw['working_dir'])   ? (string)$raw['working_dir'] : null,
            'pre_commands'  => is_array($raw['pre_commands']  ?? null) ? array_values((array)$raw['pre_commands'])  : [],
            'post_commands' => is_array($raw['post_commands'] ?? null) ? array_values((array)$raw['post_commands']) : [],
        ];
    }

    private static function normalizeRuntime(mixed $raw): array
    {
        if (!is_array($raw)) {
            return ['type' => 'system', 'shell' => '/bin/bash'];
        }
        return [
            'type'           => (string)($raw['type']          ?? 'system'),
            'image'          => isset($raw['image'])           ? (string)$raw['image']    : null,
            'conda_env'      => isset($raw['conda_env'])       ? (string)$raw['conda_env'] : null,
            'conda_packages' => is_array($raw['conda_packages'] ?? null) ? array_values((array)$raw['conda_packages']) : [],
            'conda_channels' => is_array($raw['conda_channels'] ?? null) ? array_values((array)$raw['conda_channels']) : [],
            'pip_packages'   => is_array($raw['pip_packages']  ?? null) ? array_values((array)$raw['pip_packages'])  : [],
            'env_vars'       => is_array($raw['env_vars']      ?? null) ? (array)$raw['env_vars'] : [],
            'shell'          => (string)($raw['shell']         ?? '/bin/bash'),
        ];
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Structured fallback YAML parser
    //  Handles the grammar used by SeqNode plugin YAML files without requiring
    //  the PHP yaml extension.
    // ──────────────────────────────────────────────────────────────────────────

    public static function parseFallback(string $content): array
    {
        $lines    = explode("\n", str_replace("\r\n", "\n", $content));
        $total    = count($lines);
        $sections = self::_splitSections($lines, $total);

        // 3-level nested sections (item_name: { property: value, ... })
        $rawParams  = self::_parseNestedSection($sections['params']  ?? '');
        $rawInputs  = self::_parseNestedSection($sections['inputs']  ?? '');
        $rawOutputs = self::_parseNestedSection($sections['outputs'] ?? '');

        // 2-level flat sections (property: value, sub_dict: { key: val })
        $rawInstall = self::_parseFlatSection($sections['install'] ?? '');
        $rawRuntime = self::_parseFlatSection($sections['runtime'] ?? '');

        $command    = self::_parseCommandSection($sections['command'] ?? '', $lines);
        $tags       = self::_parseTagsFromSection($sections['tags']  ?? '');
        $tf         = self::_parseTopLevelScalars($sections['_top'] ?? '', $lines);

        $parsed = array_merge($tf, [
            'params'  => $rawParams,
            'inputs'  => $rawInputs,
            'outputs' => $rawOutputs,
            'install' => empty($rawInstall) ? null : $rawInstall,
            'command' => $command,
            'runtime' => $rawRuntime,
            'tags'    => $tags,
        ]);

        if (empty($parsed['id'])) return [];
        return self::normalizePlugin($parsed);
    }

    /**
     * Parse a flat 2-level YAML section (install:, runtime:).
     * Direct key: value pairs at 2-space; sub-dicts / block-lists at 4-space.
     *
     *   install:
     *     method: conda          ← flat scalar
     *     binary: samtools       ← flat scalar
     *     default_paths:         ← starts a sub-dict
     *       bin_path: ""         ← sub-dict property
     *     conda_channels:        ← starts a block list
     *       - bioconda           ← list item
     */
    private static function _parseFlatSection(string $text): array
    {
        $result  = [];
        $subKey  = null;   // current 2-space sub-dict/list key
        $subVal  = null;   // accumulator: array (sub-dict or list)
        $isList  = false;  // true if subVal is a list

        $flush = function () use (&$result, &$subKey, &$subVal, &$isList) {
            if ($subKey !== null && $subVal !== null) {
                $result[$subKey] = $subVal;
            }
            $subKey = null; $subVal = null; $isList = false;
        };

        foreach (explode("\n", $text) as $rawLine) {
            $line   = rtrim($rawLine);
            $indent = strlen($rawLine) - strlen(ltrim($rawLine));
            $trimmed = ltrim($line);

            if ($trimmed === '' || str_starts_with($trimmed, '#')) continue;

            if ($indent >= 4 && $subKey !== null) {
                // 4-space: sub-dict property OR list item
                if (preg_match('/^\s*-\s+(.+)$/', $line, $m)) {
                    // list item
                    if (!$isList) { $subVal = []; $isList = true; }
                    $subVal[] = trim($m[1], '"\'');
                } elseif (preg_match('/^\s+([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/', $line, $m)) {
                    // sub-dict key: value
                    if ($isList || !is_array($subVal)) { $subVal = []; $isList = false; }
                    $v = rtrim($m[2]);
                    if ($v === 'true')  $subVal[$m[1]] = true;
                    elseif ($v === 'false') $subVal[$m[1]] = false;
                    elseif ($v === '' || $v === 'null' || $v === '~') $subVal[$m[1]] = null;
                    elseif (is_numeric($v)) $subVal[$m[1]] = str_contains($v, '.') ? (float)$v : (int)$v;
                    else $subVal[$m[1]] = trim($v, '"\'');
                }
                continue;
            }

            if ($indent === 2) {
                $flush();
                if (preg_match('/^\s{2}([a-zA-Z_][a-zA-Z0-9_]*):\s*$/', $line, $m)) {
                    // Key with no inline value → starts sub-dict or list
                    $subKey = $m[1]; $subVal = []; $isList = false;
                } elseif (preg_match('/^\s{2}([a-zA-Z_][a-zA-Z0-9_]*):\s+(.+)$/', $line, $m)) {
                    // Key with inline value → scalar
                    $k = $m[1]; $v = rtrim($m[2]);
                    if (str_starts_with($v, '[') && str_ends_with($v, ']')) {
                        $inner  = trim(substr($v, 1, -1));
                        $result[$k] = $inner === '' ? [] : array_map(fn($x) => trim($x, ' "\''), explode(',', $inner));
                    } elseif ($v === 'true')  $result[$k] = true;
                    elseif ($v === 'false') $result[$k] = false;
                    elseif ($v === '' || $v === 'null' || $v === '~') $result[$k] = null;
                    elseif (is_numeric($v)) $result[$k] = str_contains($v, '.') ? (float)$v : (int)$v;
                    elseif (str_starts_with($v, '> ') || str_starts_with($v, '| ')) $result[$k] = trim(substr($v, 2));
                    else $result[$k] = trim($v, '"\'');
                }
                continue;
            }
        }
        $flush();
        return $result;
    }

    /**
     * Split the YAML content into named top-level sections.
     * Returns ['_top' => '...', 'params' => '...', 'inputs' => '...', ...]
     */
    private static function _splitSections(array $lines, int $total): array
    {
        $sections      = ['_top' => []];
        $currentKey    = '_top';
        $knownSections = ['params', 'inputs', 'outputs', 'install', 'command', 'runtime', 'tags'];

        for ($i = 0; $i < $total; $i++) {
            $line = $lines[$i];

            // Detect a top-level section key (no leading whitespace, ends with :)
            if (preg_match('/^([a-zA-Z_][a-zA-Z0-9_]*):\s*$/', $line, $m) &&
                in_array($m[1], $knownSections, true)) {
                $currentKey = $m[1];
                if (!isset($sections[$currentKey])) $sections[$currentKey] = [];
                continue;
            }

            $sections[$currentKey][] = $line;
        }

        // Convert arrays back to strings
        $out = [];
        foreach ($sections as $k => $v) {
            $out[$k] = is_array($v) ? implode("\n", $v) : $v;
        }
        return $out;
    }

    /**
     * Parse a 2-level YAML section (used for params, inputs, outputs).
     *
     * Input text (after the section key line) looks like:
     *
     *   <empty>
     *   param_key:
     *     type: string
     *     label: "My Label"
     *     default: value
     *     description: >
     *       Multi-line description text
     *
     * Returns: ['param_key' => ['type' => 'string', 'label' => 'My Label', ...], ...]
     */
    private static function _parseNestedSection(string $text): array
    {
        $result = [];
        $lines  = explode("\n", $text);
        $total  = count($lines);

        $currentEntry   = null;  // key of the current 2nd-level object
        $currentProps   = [];    // properties of currentEntry
        $blockPropKey   = null;  // key of block-scalar property being accumulated
        $blockLines     = [];    // lines of the current block scalar

        $flushBlock = function () use (&$blockPropKey, &$blockLines, &$currentProps) {
            if ($blockPropKey !== null) {
                $currentProps[$blockPropKey] = trim(implode(' ', array_filter(array_map('trim', $blockLines))));
                $blockPropKey = null;
                $blockLines   = [];
            }
        };

        $flushEntry = function () use (&$currentEntry, &$currentProps, &$result, $flushBlock) {
            $flushBlock();
            if ($currentEntry !== null) {
                $result[$currentEntry] = $currentProps;
                $currentEntry = null;
                $currentProps = [];
            }
        };

        for ($i = 0; $i < $total; $i++) {
            $raw    = $lines[$i];
            $line   = rtrim($raw);
            $indent = strlen($raw) - strlen(ltrim($raw));

            // Skip blank lines (but accumulate them in block scalars)
            if (trim($line) === '') {
                if ($blockPropKey !== null) $blockLines[] = '';
                continue;
            }

            // Skip comment lines
            if (ltrim($line)[0] === '#') continue;

            // Indented 2+ spaces: either a 2nd-level key or 3rd-level (block scalar content)
            if ($indent >= 2 && $indent < 4) {
                // 2-space: entry key (e.g. "  threads:")
                if (preg_match('/^\s{2}([a-zA-Z_][a-zA-Z0-9_]*):\s*$/', $line, $m)) {
                    $flushEntry();
                    $currentEntry = $m[1];
                    $currentProps = [];
                    continue;
                }
                // If we somehow get here with a value, treat as entry + inline
                if (preg_match('/^\s{2}([a-zA-Z_][a-zA-Z0-9_]*):\s+(.+)$/', $line, $m)) {
                    $flushEntry();
                    $currentEntry = $m[1];
                    $currentProps = [];
                    // inline value means it's a scalar entry (not a sub-object) — skip
                    continue;
                }
            }

            if ($indent >= 4 && $currentEntry !== null) {
                // 4-space: property inside current entry
                // Block scalar continuation
                if ($blockPropKey !== null) {
                    if ($indent >= 6 || ($indent === 4 && !preg_match('/^[a-zA-Z_]/', ltrim($line)))) {
                        $blockLines[] = trim($line);
                        continue;
                    }
                    // New property starts at indent 4 — flush the block
                    $flushBlock();
                }

                // Property key: value
                if (preg_match('/^\s{4}([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/', $line, $m)) {
                    $propKey = $m[1];
                    $propVal = rtrim($m[2]);

                    // Block scalar marker
                    if ($propVal === '>' || $propVal === '|') {
                        $blockPropKey = $propKey;
                        $blockLines   = [];
                        continue;
                    }

                    // Inline block scalar: "description: > some text"
                    if (str_starts_with($propVal, '> ') || str_starts_with($propVal, '| ')) {
                        $currentProps[$propKey] = trim(substr($propVal, 2));
                        continue;
                    }

                    // Inline list: [a, b, c]
                    if (str_starts_with($propVal, '[') && str_ends_with($propVal, ']')) {
                        $inner   = trim(substr($propVal, 1, -1));
                        $currentProps[$propKey] = $inner === '' ? [] : array_map(
                            fn($v) => trim($v, ' "\''),
                            explode(',', $inner)
                        );
                        continue;
                    }

                    // Boolean
                    if ($propVal === 'true')  { $currentProps[$propKey] = true;  continue; }
                    if ($propVal === 'false') { $currentProps[$propKey] = false; continue; }

                    // Null
                    if ($propVal === '' || $propVal === 'null' || $propVal === '~') {
                        $currentProps[$propKey] = null;
                        continue;
                    }

                    // Number
                    if (is_numeric($propVal)) {
                        $currentProps[$propKey] = str_contains($propVal, '.') ? (float)$propVal : (int)$propVal;
                        continue;
                    }

                    // Quoted string
                    $currentProps[$propKey] = trim($propVal, '"\'');
                    continue;
                }

                // Inline list items inside a property (6-space: "      - value")
                if (preg_match('/^\s{6}-\s+(.+)$/', $line, $m)) {
                    // Find the last set property key that has no value yet
                    // (This handles: "extensions:\n  - .bam")
                    $last = array_key_last($currentProps);
                    if ($last !== null && ($currentProps[$last] === null || $currentProps[$last] === '')) {
                        $currentProps[$last] = [];
                    }
                    if ($last !== null && is_array($currentProps[$last])) {
                        $currentProps[$last][] = trim($m[1], '"\'');
                    }
                    continue;
                }

                // 4-space list item "    - value" (e.g. conda_packages items)
                if (preg_match('/^\s{4}-\s+(.+)$/', $line, $m)) {
                    $last = array_key_last($currentProps);
                    if ($last !== null && is_array($currentProps[$last])) {
                        $currentProps[$last][] = trim($m[1], '"\'');
                    }
                    continue;
                }

                continue; // deeper indentation, skip
            }

            // Top-level line inside this section (0 indent) — not part of a nested entry
            // e.g. "command: set -o pipefail; ..."
            // We're outside the nested structure; flush the current entry
            if ($indent === 0 && $currentEntry !== null) {
                $flushEntry();
            }
        }

        $flushEntry(); // flush the last entry
        return $result;
    }

    /**
     * Parse the command: section which can be either a scalar or a nested dict.
     */
    private static function _parseCommandSection(string $sectionText, array $allLines): mixed
    {
        // Search for "command:" in the original lines to capture its value
        foreach ($allLines as $idx => $line) {
            if (!preg_match('/^command:\s*(.*)$/', $line, $m)) continue;
            $val = rtrim($m[1]);

            // Inline string: "command: samtools view ..."
            if ($val !== '' && $val !== '>' && $val !== '|' && !str_starts_with($val, '> ')) {
                return trim($val, '"\'');
            }

            // Block scalar: collect until next top-level key
            if ($val === '>' || $val === '|' || str_starts_with($val, '> ')) {
                $parts = $val === '>' || $val === '|' ? [] : [trim(substr($val, 2))];
                for ($j = $idx + 1; $j < count($allLines); $j++) {
                    $l = $allLines[$j];
                    if ($l !== '' && !preg_match('/^\s/', $l)) break;
                    $parts[] = trim($l);
                }
                return trim(implode(' ', array_filter($parts)));
            }

            // Dict (indented sub-block): parse as nested section
            $nested = self::_parseCommandDict($allLines, $idx + 1);
            return empty($nested) ? '' : $nested;
        }
        return '';
    }

    private static function _parseCommandDict(array $lines, int $start): array
    {
        $result = [];
        $total  = count($lines);
        $blockKey = null;
        $blockBuf = [];

        for ($i = $start; $i < $total; $i++) {
            $line   = rtrim($lines[$i]);
            $indent = strlen($lines[$i]) - strlen(ltrim($lines[$i]));

            if ($indent === 0 && trim($line) !== '') break; // back to top level

            if ($indent >= 2) {
                if ($blockKey !== null) {
                    if ($indent >= 4) { $blockBuf[] = trim($line); continue; }
                    $result[$blockKey] = trim(implode("\n", $blockBuf));
                    $blockKey = null; $blockBuf = [];
                }
                if (preg_match('/^\s{2}([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/', $line, $m)) {
                    $k = $m[1]; $v = rtrim($m[2]);
                    if ($v === '|' || $v === '>') { $blockKey = $k; $blockBuf = []; continue; }
                    if ($v === 'true')  { $result[$k] = true;  continue; }
                    if ($v === 'false') { $result[$k] = false; continue; }
                    if ($v === '' || $v === 'null') { $result[$k] = null; continue; }
                    if (is_numeric($v)) { $result[$k] = str_contains($v, '.') ? (float)$v : (int)$v; continue; }
                    $result[$k] = trim($v, '"\'');
                }
            }
        }
        if ($blockKey !== null) $result[$blockKey] = trim(implode("\n", $blockBuf));
        return $result;
    }

    /** Parse top-level scalar fields (name, id, version, category, description, author, license). */
    private static function _parseTopLevelScalars(string $text, array $allLines): array
    {
        $f     = [];
        $lines = explode("\n", $text);
        $total = count($lines);

        // Also scan all lines for top-level scalars that might appear in other sections
        $scanLines = $allLines;

        $i = 0;
        while ($i < count($scanLines)) {
            $line = rtrim($scanLines[$i]);

            if (!preg_match('/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/', $line, $m)) {
                $i++;
                continue;
            }

            $key = $m[1];
            $val = rtrim($m[2]);

            // Only capture scalar top-level fields
            if (!in_array($key, ['id','name','version','category','description','author','license'], true)) {
                $i++;
                continue;
            }

            // Block scalar: > or |
            if ($val === '>' || $val === '|') {
                $parts = [];
                $i++;
                while ($i < count($scanLines) && ($scanLines[$i] === '' || preg_match('/^\s+/', $scanLines[$i]))) {
                    $parts[] = trim($scanLines[$i]);
                    $i++;
                }
                $f[$key] = implode(' ', array_filter($parts));
                continue;
            }

            // Inline block marker
            if (str_starts_with($val, '> ') || str_starts_with($val, '| ')) {
                $f[$key] = trim(substr($val, 2));
                $i++;
                continue;
            }

            // Skip complex values
            if (str_starts_with($val, '[') || str_starts_with($val, '{')) {
                $i++;
                continue;
            }

            $f[$key] = trim($val, '"\'');
            $i++;
        }

        return $f;
    }

    /** Parse the tags: section (inline list or block list). */
    private static function _parseTagsFromSection(string $text): array
    {
        // Search for "tags:" in the text
        if (preg_match('/^tags:\s*\[([^\]]*)\]/m', $text, $m)) {
            $inner = trim($m[1]);
            return $inner === '' ? [] : array_map(fn($v) => trim($v, ' "\''), explode(',', $inner));
        }
        // Block list
        $tags = [];
        foreach (explode("\n", $text) as $line) {
            if (preg_match('/^\s*-\s+(.+)$/', $line, $m)) {
                $tags[] = trim($m[1], '"\'');
            }
        }
        return $tags;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Diagnostic helpers — used by diagnose_plugins.php
    // ──────────────────────────────────────────────────────────────────────────

    public static function hasYamlExtension(): bool
    {
        return function_exists('yaml_parse');
    }

    public static function pluginsDir(): string
    {
        return self::dir();
    }
}
