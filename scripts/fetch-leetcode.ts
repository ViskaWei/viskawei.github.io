/**
 * LeetCode Stats Scraper — Fetches user profile stats via GraphQL.
 * Falls back to alfa-leetcode-api.onrender.com when official API blocks.
 * Outputs to src/data/leetcode-stats.json for the Algorithm Galaxy.
 *
 * Usage: npx tsx scripts/fetch-leetcode.ts --username <username>
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../src/data/leetcode-stats.json');

interface LeetCodeStats {
  username: string;
  fetchedAt: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  tagStats: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
}

type TagEntry = { tagName: string; tagSlug: string; problemsSolved: number };

function getUsername(): string {
  const args = process.argv.slice(2);
  const idx = args.indexOf('--username');
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return 'Vikalaka';
}

// ── Official LeetCode GraphQL ────────────────────────────────

async function fetchGraphQL(query: string, variables: Record<string, unknown>): Promise<any> {
  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`LeetCode API returned ${res.status}`);
  return res.json();
}

async function fetchOfficialStats(username: string): Promise<LeetCodeStats> {
  const overallQuery = `
    query($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal { acSubmissionNum { difficulty count } }
      }
    }
  `;
  const tagQuery = `
    query($username: String!) {
      matchedUser(username: $username) {
        tagProblemCounts {
          advanced { tagName tagSlug problemsSolved }
          intermediate { tagName tagSlug problemsSolved }
          fundamental { tagName tagSlug problemsSolved }
        }
      }
    }
  `;

  const [overallData, tagData] = await Promise.all([
    fetchGraphQL(overallQuery, { username }),
    fetchGraphQL(tagQuery, { username }),
  ]);

  const acStats = overallData?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum;
  const byDiff: Record<string, number> = {};
  if (acStats) for (const s of acStats) byDiff[s.difficulty] = s.count;

  const counts = tagData?.data?.matchedUser?.tagProblemCounts;
  const tagMap = new Map<string, TagEntry>();
  if (counts) {
    for (const level of [counts.fundamental, counts.intermediate, counts.advanced]) {
      if (!level) continue;
      for (const tag of level) {
        const existing = tagMap.get(tag.tagSlug);
        if (!existing || existing.problemsSolved < tag.problemsSolved) {
          tagMap.set(tag.tagSlug, { tagName: tag.tagName, tagSlug: tag.tagSlug, problemsSolved: tag.problemsSolved });
        }
      }
    }
  }

  return {
    username,
    fetchedAt: new Date().toISOString(),
    totalSolved: byDiff['All'] || 0,
    easySolved: byDiff['Easy'] || 0,
    mediumSolved: byDiff['Medium'] || 0,
    hardSolved: byDiff['Hard'] || 0,
    tagStats: Array.from(tagMap.values()),
  };
}

// ── Fallback: third-party API ────────────────────────────────

async function fetchFallbackStats(username: string): Promise<LeetCodeStats> {
  const BASE = 'https://alfa-leetcode-api.onrender.com';

  const [solvedRes, skillRes] = await Promise.all([
    fetch(`${BASE}/${username}/solved`),
    fetch(`${BASE}/skillStats/${username}`),
  ]);

  if (!solvedRes.ok) throw new Error(`Fallback solved API: ${solvedRes.status}`);
  const solved = await solvedRes.json();

  const tagMap = new Map<string, TagEntry>();
  if (skillRes.ok) {
    const skillData = await skillRes.json();
    const counts = skillData?.matchedUser?.tagProblemCounts;
    if (counts) {
      for (const level of [counts.fundamental, counts.intermediate, counts.advanced]) {
        if (!level) continue;
        for (const tag of level) {
          const existing = tagMap.get(tag.tagSlug);
          if (!existing || existing.problemsSolved < tag.problemsSolved) {
            tagMap.set(tag.tagSlug, { tagName: tag.tagName, tagSlug: tag.tagSlug, problemsSolved: tag.problemsSolved });
          }
        }
      }
    }
  }

  return {
    username,
    fetchedAt: new Date().toISOString(),
    totalSolved: solved.solvedProblem || 0,
    easySolved: solved.easySolved || 0,
    mediumSolved: solved.mediumSolved || 0,
    hardSolved: solved.hardSolved || 0,
    tagStats: Array.from(tagMap.values()),
  };
}

// ── Main ─────────────────────────────────────────────────────

function writeStats(stats: LeetCodeStats): void {
  writeFileSync(OUTPUT_PATH, JSON.stringify(stats, null, 2) + '\n');
}

function writeEmptyStats(username: string): void {
  writeStats({
    username,
    fetchedAt: new Date().toISOString(),
    totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0,
    tagStats: [],
  });
  console.log(`[fetch-leetcode] Wrote empty fallback to ${OUTPUT_PATH}`);
}

async function main() {
  const username = getUsername();
  console.log(`[fetch-leetcode] Fetching stats for "${username}"...`);

  // Try official API first
  try {
    const stats = await fetchOfficialStats(username);
    if (stats.totalSolved > 0 || stats.tagStats.length > 0) {
      writeStats(stats);
      console.log(`[fetch-leetcode] Official API: ${stats.totalSolved} solved, ${stats.tagStats.length} tags`);
      return;
    }
    console.log('[fetch-leetcode] Official API returned empty, trying fallback...');
  } catch (err) {
    console.log(`[fetch-leetcode] Official API failed (${err}), trying fallback...`);
  }

  // Fallback to third-party API
  try {
    const stats = await fetchFallbackStats(username);
    writeStats(stats);
    console.log(`[fetch-leetcode] Fallback API: ${stats.totalSolved} solved, ${stats.tagStats.length} tags`);
  } catch (err) {
    console.error(`[fetch-leetcode] All APIs failed: ${err}`);
    writeEmptyStats(username);
  }
}

main();
