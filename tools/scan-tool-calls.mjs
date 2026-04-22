// One-shot scanner: parses Claude Code session JSONL transcripts and tallies
// tool call frequencies (Bash command+subcommand pairs, MCP tool names).
// Output: sorted markdown-style tally for permission-allowlist triage.
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const TRANSCRIPT_DIR = 'C:/Users/rsand/.claude/projects/C--Users-rsand-Documents-Claude-Desk-top';

function leadingTokens(cmd) {
  // Strip env-var prefixes, sudo, timeout, and any leading "cd <path>" segments.
  // For chained commands (cmd1 && cmd2 && cmd3), iterate through segments and
  // return the first non-cd, non-noise command's first+second token.
  const segments = cmd.split(/&&|\|\||;/).map(s => s.trim()).filter(Boolean);
  for (const seg of segments) {
    // For each segment, only the first piped sub-command matters (rest is filter chain)
    const head = seg.split('|')[0].trim();
    const parts = head.split(/\s+/).filter(Boolean);
    while (parts.length && /^[A-Z_][A-Z0-9_]*=/.test(parts[0])) parts.shift();
    if (parts[0] === 'sudo') parts.shift();
    if (parts[0] === 'timeout' && parts[1] && /^\d/.test(parts[1])) parts.splice(0, 2);
    if (parts[0] === 'cd') continue; // skip cd segments, look at next
    if (parts[0] === 'sleep' && parts[1] && /^\d/.test(parts[1])) continue; // skip sleep gates
    if (parts.length === 0) continue;
    const cmd0 = parts[0];
    const cmd1 = parts[1] && !parts[1].startsWith('-') && !parts[1].startsWith('"') && !parts[1].startsWith('$') && !parts[1].startsWith('/') ? parts[1] : null;
    return cmd1 ? `${cmd0} ${cmd1}` : cmd0;
  }
  return null;
}

const bashCounts = new Map();
const mcpCounts = new Map();
const bashFullExamples = new Map(); // pair -> sample full command for context

const files = fs.readdirSync(TRANSCRIPT_DIR)
  .filter(f => f.endsWith('.jsonl'))
  .map(f => path.join(TRANSCRIPT_DIR, f))
  .map(f => ({ f, mtime: fs.statSync(f).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime)
  .slice(0, 50)
  .map(x => x.f);

let processed = 0;
let toolUseSeen = 0;

async function processFile(file) {
  const rl = readline.createInterface({
    input: fs.createReadStream(file, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let obj;
    try { obj = JSON.parse(line); } catch { continue; }
    if (obj.type !== 'assistant') continue;
    const content = obj.message?.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      if (c.type !== 'tool_use') continue;
      toolUseSeen++;
      const name = c.name;
      if (name === 'Bash') {
        const cmd = c.input?.command;
        if (typeof cmd !== 'string') continue;
        const key = leadingTokens(cmd);
        if (!key) continue;
        bashCounts.set(key, (bashCounts.get(key) || 0) + 1);
        if (!bashFullExamples.has(key)) bashFullExamples.set(key, cmd.slice(0, 100));
      } else if (name && name.startsWith('mcp__')) {
        mcpCounts.set(name, (mcpCounts.get(name) || 0) + 1);
      }
    }
  }
  processed++;
}

for (const f of files) await processFile(f);

console.log(`Scanned ${processed}/${files.length} files. Total tool_use entries seen: ${toolUseSeen}\n`);

console.log('# Bash command+subcommand frequencies (sorted desc)');
const bashRows = [...bashCounts.entries()].sort((a, b) => b[1] - a[1]);
for (const [k, v] of bashRows) {
  console.log(`${String(v).padStart(5)}  ${k}   |  e.g. ${bashFullExamples.get(k)}`);
}

console.log('\n# MCP tool frequencies (sorted desc)');
const mcpRows = [...mcpCounts.entries()].sort((a, b) => b[1] - a[1]);
for (const [k, v] of mcpRows) {
  console.log(`${String(v).padStart(5)}  ${k}`);
}
