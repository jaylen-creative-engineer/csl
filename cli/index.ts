#!/usr/bin/env node
/**
 * CSL Interactive CLI
 * Validates Creative Sports League domain services and surfaces implementation gaps.
 * Run: npm run cli
 */

import { createInterface } from 'node:readline/promises';
import process from 'node:process';
import { LeagueModelService } from '../src/league-model/league-model.service.js';
import { ChallengeService } from '../src/challenge-intelligence/challenge.service.js';
import { ShowcaseService } from '../src/showcase-intelligence/showcase.service.js';
import { SponsorService } from '../src/sponsor-intelligence/sponsor.service.js';
import { Discipline } from '../src/league-model/types.js';
import { SponsorOutcomeStatus } from '../src/sponsor-intelligence/types.js';
import type { LeagueHost, League, Participant, Season } from '../src/league-model/types.js';
import type { Challenge, Submission } from '../src/challenge-intelligence/types.js';
import type { Sponsor, SponsorAttachment } from '../src/sponsor-intelligence/types.js';

// ─── ANSI Colors ──────────────────────────────────────────────────────────────
const R = '\x1b[0m';
const b = (s: string) => `\x1b[1m${s}${R}`;
const dim = (s: string) => `\x1b[2m${s}${R}`;
const cyan = (s: string) => `\x1b[36m${s}${R}`;
const green = (s: string) => `\x1b[32m${s}${R}`;
const yellow = (s: string) => `\x1b[33m${s}${R}`;
const red = (s: string) => `\x1b[31m${s}${R}`;
const blue = (s: string) => `\x1b[34m${s}${R}`;
const gray = (s: string) => `\x1b[90m${s}${R}`;

// ─── Display Helpers ──────────────────────────────────────────────────────────
function header(title: string) {
  const line = '─'.repeat(58);
  console.log(`\n\x1b[36m\x1b[1m${line}\n  ${title}\n${line}${R}\n`);
}

function subHeader(title: string) {
  console.log(`\n${blue(b(`▸ ${title}`))}`);
}

function ok(msg: string)   { console.log(`  ${green('✓')}  ${msg}`); }
function warn(msg: string) { console.log(`  ${yellow('⚠')}  ${msg}`); }
function fail(msg: string) { console.log(`  ${red('✗')}  ${msg}`); }
function info(msg: string) { console.log(`  ${gray('ℹ')}  ${msg}`); }
function kv(k: string, v: string) { console.log(`  ${gray(k + ':')}  ${v}`); }

type RL = ReturnType<typeof createInterface>;

async function pressEnter(rl: RL) {
  await rl.question(`\n${dim('  Press Enter to continue...')} `);
}

// ─── Readline Helpers ─────────────────────────────────────────────────────────
async function ask(rl: RL, question: string): Promise<string> {
  const answer = await rl.question(`  ${yellow('?')}  ${question} `);
  return answer.trim();
}

async function confirm(rl: RL, question: string): Promise<boolean> {
  const a = await ask(rl, `${question} ${gray('(y/n)')}`);
  return a.toLowerCase().startsWith('y');
}

async function pickFrom<T>(
  rl: RL,
  label: string,
  items: T[],
  display: (item: T) => string,
): Promise<T | null> {
  if (items.length === 0) {
    warn(`No ${label} available yet.`);
    return null;
  }
  console.log(`\n  ${b(label)}:`);
  items.forEach((item, i) =>
    console.log(`    ${gray(`[${i + 1}]`)} ${display(item)}`),
  );
  console.log(`    ${gray('[0]')} ${dim('Cancel')}`);
  const raw = await ask(rl, `Select 1–${items.length}:`);
  const idx = parseInt(raw, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx >= items.length) return null;
  return items[idx] ?? null;
}

async function menu(
  rl: RL,
  options: Array<{ key: string; label: string }>,
): Promise<string> {
  options.forEach((o) => console.log(`    ${gray(`[${o.key}]`)} ${o.label}`));
  return ask(rl, 'Choose:');
}

// ─── Services & Session State ─────────────────────────────────────────────────
const leagueService   = new LeagueModelService();
const challengeService = new ChallengeService();
const showcaseService  = new ShowcaseService(leagueService, challengeService);
const sponsorService   = new SponsorService(challengeService);

const S = {
  hosts:       [] as LeagueHost[],
  seasons:     [] as Season[],
  leagues:     [] as League[],
  participants: [] as Participant[],
  challenges:  [] as Challenge[],
  submissions: [] as Submission[],
  sponsors:    [] as Sponsor[],
  attachments: [] as SponsorAttachment[],
};

// ─── Gap Registry ─────────────────────────────────────────────────────────────
interface Gap { domain: string; title: string; detail: string; severity: 'critical'|'high'|'medium'|'low' }

const GAPS: Gap[] = [
  {
    domain: 'League',
    severity: 'high',
    title: 'League.challengeIds never populated',
    detail: 'ChallengeService.createChallenge() stores the leagueId on the Challenge but never adds the challenge ID back to League.challengeIds. The array stays empty forever.',
  },
  {
    domain: 'League',
    severity: 'high',
    title: 'No listLeagues() / listHosts()',
    detail: 'No method to enumerate all leagues or hosts. External callers must maintain their own ID registries.',
  },
  {
    domain: 'League',
    severity: 'medium',
    title: 'No withdrawParticipant()',
    detail: 'Once enrolled, a participant cannot be withdrawn. EnrollmentStatus.Withdrawn is defined but never set by any service method.',
  },
  {
    domain: 'Challenge',
    severity: 'high',
    title: 'No getChallengesForLeague()',
    detail: 'No way to list all challenges belonging to a league. Callers must track challenge IDs externally.',
  },
  {
    domain: 'Challenge',
    severity: 'high',
    title: 'Multi-judge scoring not supported',
    detail: 'scoreSubmission() unconditionally replaces Submission.score. A second judge call silently overwrites the first — no aggregation, no history.',
  },
  {
    domain: 'Challenge',
    severity: 'medium',
    title: 'No challenge editing after creation',
    detail: 'No updateChallenge() method. Title, prompt, deadline, and criteria are immutable once created.',
  },
  {
    domain: 'Challenge',
    severity: 'medium',
    title: 'No submission withdrawal',
    detail: 'Once submitted, an entry cannot be retracted or edited. isPublic is also locked at submission time.',
  },
  {
    domain: 'Challenge',
    severity: 'medium',
    title: 'sponsorId field not validated on creation',
    detail: 'CreateChallengeInput.sponsorId is stored as-is with no lookup against SponsorService. A challenge can reference a non-existent sponsor.',
  },
  {
    domain: 'Sponsor',
    severity: 'high',
    title: 'Sponsor–challenge link is one-directional',
    detail: 'attachToChallenge() creates a SponsorAttachment but does not set Challenge.sponsorId. The two sides of the relationship are not kept in sync.',
  },
  {
    domain: 'Sponsor',
    severity: 'medium',
    title: 'opportunityExtendedTo is unactionable',
    detail: 'SponsorOutcome.opportunityExtendedTo stores a participantId but no service acts on it — no notification, no follow-up, no query path.',
  },
  {
    domain: 'Showcase',
    severity: 'low',
    title: 'No pagination on list operations',
    detail: 'getShowcaseFeed(), getLeaderboard(), and listParticipants() return unbounded slices. Only getTopPerformers() accepts a limit.',
  },
  {
    domain: 'System',
    severity: 'critical',
    title: 'No persistence layer',
    detail: 'All state is in-memory. Process restart destroys all data. (Phase 1 roadmap item.)',
  },
  {
    domain: 'System',
    severity: 'low',
    title: 'No typed error classes',
    detail: 'All failures throw plain Error objects. No domain-specific error types (InvalidStatusTransition, DuplicateEnrollment, etc.) for programmatic handling.',
  },
];

function printGapReport() {
  header('Gap Analysis Report');
  const icon = (s: Gap['severity']) =>
    ({ critical: red('●'), high: yellow('●'), medium: blue('●'), low: gray('●') }[s]);

  const levels: Array<[Gap['severity'], string]> = [
    ['critical', 'CRITICAL'],
    ['high', 'HIGH'],
    ['medium', 'MEDIUM'],
    ['low', 'LOW'],
  ];

  for (const [sev, label] of levels) {
    const gaps = GAPS.filter((g) => g.severity === sev);
    if (!gaps.length) continue;
    subHeader(`${icon(sev)}  ${label}  (${gaps.length})`);
    gaps.forEach((g) => {
      console.log(`\n  ${b(g.title)}  ${gray(`[${g.domain}]`)}`);
      console.log(`  ${dim(g.detail)}`);
    });
  }

  console.log(`\n${gray('─'.repeat(58))}`);
  const total = GAPS.length;
  const counts = levels
    .map(([s, l]) => `${icon(s)} ${GAPS.filter((g) => g.severity === s).length} ${l.toLowerCase()}`)
    .join('  ');
  console.log(`\n  Total: ${b(String(total))}  —  ${counts}\n`);
}

// ─── League Menu ──────────────────────────────────────────────────────────────
async function leagueMenu(rl: RL) {
  while (true) {
    header('League Management');
    info(`${S.hosts.length} hosts  ${S.seasons.length} seasons  ${S.leagues.length} leagues  ${S.participants.length} participants`);
    console.log();

    const choice = await menu(rl, [
      { key: '1', label: 'Create League Host' },
      { key: '2', label: 'Create Season' },
      { key: '3', label: 'Create League' },
      { key: '4', label: 'Create Participant' },
      { key: '5', label: 'Enroll Participant in League' },
      { key: '6', label: 'List Participants in League' },
      { key: '7', label: 'View League Details' },
      { key: '8', label: 'Activate League  (draft → active)' },
      { key: '9', label: 'Close League  (active → closed)' },
      { key: '0', label: dim('Back') },
    ]);

    if (choice === '0') return;

    try {
      if (choice === '1') {
        const name = await ask(rl, 'Host name:');
        const org  = await ask(rl, 'Organization:');
        const host = leagueService.createLeagueHost({ name, organization: org });
        S.hosts.push(host);
        ok(`Host created: ${b(host.name)}  ${gray(host.id)}`);

      } else if (choice === '2') {
        const name      = await ask(rl, 'Season name:');
        const startDate = await ask(rl, `Start date ${gray('(YYYY-MM-DD)')}: `);
        const endDate   = await ask(rl, `End date ${gray('(YYYY-MM-DD)')}: `);
        const season = leagueService.createSeason({ name, startDate, endDate });
        S.seasons.push(season);
        ok(`Season created: ${b(season.name)}  ${gray(season.id)}`);

      } else if (choice === '3') {
        const host = await pickFrom(rl, 'League Host', S.hosts, (h) => `${b(h.name)} — ${h.organization}  ${gray(h.id)}`);
        if (!host) continue;
        const name = await ask(rl, 'League name:');
        let seasonId: string | undefined;
        if (S.seasons.length > 0 && await confirm(rl, 'Attach a season?')) {
          const s = await pickFrom(rl, 'Season', S.seasons, (s) => `${b(s.name)} (${s.startDate}→${s.endDate})`);
          if (s) seasonId = s.id;
        }
        const league = leagueService.createLeague({ name, hostId: host.id, seasonId });
        S.leagues.push(league);
        ok(`League created: ${b(league.name)}  status=${yellow(league.status)}  ${gray(league.id)}`);

      } else if (choice === '4') {
        const handle      = await ask(rl, 'Handle (e.g. @alex):');
        const disciplines = Object.values(Discipline);
        console.log('\n  Disciplines:');
        disciplines.forEach((d, i) => console.log(`    ${gray(`[${i + 1}]`)} ${d}`));
        const dRaw = await ask(rl, 'Select:');
        const discipline = disciplines[parseInt(dRaw, 10) - 1] ?? Discipline.Other;
        const p = leagueService.createParticipant({ handle, discipline });
        S.participants.push(p);
        ok(`Participant created: ${b(p.handle)}  [${p.discipline}]  ${gray(p.id)}`);

      } else if (choice === '5') {
        const league = await pickFrom(rl, 'League', S.leagues, (l) => `${b(l.name)}  ${gray(l.id)}`);
        if (!league) continue;
        const p = await pickFrom(rl, 'Participant', S.participants, (p) => `${b(p.handle)}  [${p.discipline}]`);
        if (!p) continue;
        const result = leagueService.enrollParticipant(league.id, p.id);
        if (result.success) ok(`${b(p.handle)} enrolled in ${b(league.name)}`);
        else warn(`Enrollment failed: ${result.reason}`);

      } else if (choice === '6') {
        const league = await pickFrom(rl, 'League', S.leagues, (l) => `${b(l.name)}  ${gray(l.id)}`);
        if (!league) continue;
        const members = leagueService.listParticipants(league.id);
        subHeader(`Participants in "${league.name}"  (${members.length})`);
        if (!members.length) info('None enrolled.');
        members.forEach((p) => kv(p.id, `${b(p.handle)} — ${p.discipline}`));
        await pressEnter(rl);

      } else if (choice === '7') {
        const league = await pickFrom(rl, 'League', S.leagues, (l) => `${b(l.name)}  ${gray(l.id)}`);
        if (!league) continue;
        const host   = leagueService.getLeagueHost(league.hostId);
        const season = league.seasonId ? leagueService.getSeason(league.seasonId) : null;
        subHeader(`League: ${league.name}`);
        kv('ID',     gray(league.id));
        kv('Status', yellow(league.status));
        kv('Host',   host ? `${b(host.name)} — ${host.organization}` : gray('unknown'));
        kv('Season', season ? `${b(season.name)} (${season.startDate}→${season.endDate})` : gray('none'));
        kv('challengeIds', league.challengeIds.length
          ? league.challengeIds.join(', ')
          : red('[] — never populated by ChallengeService (gap)'));
        await pressEnter(rl);

      } else if (choice === '8') {
        const drafts = S.leagues.filter((l) => l.status === 'draft');
        const league = await pickFrom(rl, 'Draft League', drafts, (l) => `${b(l.name)}  ${gray(l.id)}`);
        if (!league) continue;
        Object.assign(league, leagueService.activateLeague(league.id));
        ok(`"${b(league.name)}" is now ${green('active')}`);

      } else if (choice === '9') {
        const active = S.leagues.filter((l) => l.status === 'active');
        const league = await pickFrom(rl, 'Active League', active, (l) => `${b(l.name)}  ${gray(l.id)}`);
        if (!league) continue;
        Object.assign(league, leagueService.closeLeague(league.id));
        ok(`"${b(league.name)}" is now ${yellow('closed')}`);
      }
    } catch (e) {
      fail((e as Error).message);
    }
  }
}

// ─── Challenge Menu ───────────────────────────────────────────────────────────
async function challengeMenu(rl: RL) {
  while (true) {
    header('Challenge Management');
    info(`${S.challenges.length} challenges  ${S.submissions.length} submissions`);
    console.log();

    const choice = await menu(rl, [
      { key: '1', label: 'Create Challenge' },
      { key: '2', label: 'Open Challenge  (draft → open)' },
      { key: '3', label: 'Submit Entry' },
      { key: '4', label: 'Close for Judging  (open → judging)' },
      { key: '5', label: 'Score a Submission' },
      { key: '6', label: 'Complete Challenge  (judging → complete)' },
      { key: '7', label: 'View Leaderboard' },
      { key: '8', label: 'Diff Two Challenges' },
      { key: '0', label: dim('Back') },
    ]);

    if (choice === '0') return;

    try {
      if (choice === '1') {
        if (!S.leagues.length) { warn('Create a league first.'); continue; }
        const league = await pickFrom(rl, 'League', S.leagues, (l) => `${b(l.name)}  ${gray(l.id)}`);
        if (!league) continue;
        const title    = await ask(rl, 'Title:');
        const prompt   = await ask(rl, 'Prompt (brief description):');
        const deadline = await ask(rl, `Deadline ${gray('(YYYY-MM-DD)')}: `);

        let scoringCriteria: Array<{ name: string; weight: number }> = [];
        if (await confirm(rl, 'Add scoring criteria?')) {
          let more = true;
          while (more) {
            const name   = await ask(rl, 'Criteria name:');
            const weight = parseFloat(await ask(rl, 'Weight (0–1):'));
            scoringCriteria.push({ name, weight });
            more = await confirm(rl, 'Add another?');
          }
        }

        const c = challengeService.createChallenge({
          leagueId: league.id, title, prompt, deadline,
          scoringCriteria: scoringCriteria.length ? scoringCriteria : undefined,
        });
        S.challenges.push(c);
        ok(`Challenge created: ${b(c.title)}  status=${yellow(c.status)}  ${gray(c.id)}`);
        warn(`GAP: League.challengeIds not updated — still ${JSON.stringify(league.challengeIds)}`);

      } else if (choice === '2') {
        const drafts = S.challenges.filter((c) => c.status === 'draft');
        const c = await pickFrom(rl, 'Draft Challenge', drafts, (c) => `${b(c.title)}  ${gray(c.id)}`);
        if (!c) continue;
        Object.assign(c, challengeService.openChallenge(c.id));
        ok(`"${b(c.title)}" is now ${green('open')}`);

      } else if (choice === '3') {
        const open = S.challenges.filter((c) => c.status === 'open');
        const c = await pickFrom(rl, 'Open Challenge', open, (c) => `${b(c.title)}  ${gray(c.id)}`);
        if (!c) continue;
        const p = await pickFrom(rl, 'Participant', S.participants, (p) => `${b(p.handle)}  [${p.discipline}]`);
        if (!p) continue;
        const url      = await ask(rl, 'Artifact URL:');
        const desc     = await ask(rl, 'Description (optional):');
        const isPublic = await confirm(rl, 'Make public?');
        const sub = challengeService.submitEntry(c.id, p.id, {
          artifact: { url, description: desc || undefined },
          isPublic,
        });
        S.submissions.push(sub);
        ok(`Entry submitted by ${b(p.handle)}  ${gray(sub.id)}`);

      } else if (choice === '4') {
        const open = S.challenges.filter((c) => c.status === 'open');
        const c = await pickFrom(rl, 'Open Challenge', open, (c) => `${b(c.title)}  ${gray(c.id)}`);
        if (!c) continue;
        Object.assign(c, challengeService.closeForJudging(c.id));
        ok(`"${b(c.title)}" is now ${yellow('judging')}`);

      } else if (choice === '5') {
        const judging = S.challenges.filter((c) => c.status === 'judging');
        const c = await pickFrom(rl, 'Challenge in Judging', judging, (c) => `${b(c.title)}  ${gray(c.id)}`);
        if (!c) continue;
        const challengeSubs = S.submissions.filter((s) => s.challengeId === c.id);
        const sub = await pickFrom(rl, 'Submission', challengeSubs, (s) => {
          const p = S.participants.find((p) => p.id === s.participantId);
          const scored = s.score ? green(` scored:${s.score.totalScore}`) : '';
          return `${b(p?.handle ?? s.participantId)}${scored}  ${gray(s.id)}`;
        });
        if (!sub) continue;

        const judgeId  = await ask(rl, 'Judge ID:');
        const rationale = await ask(rl, 'Rationale:');
        let criteriaScores: Array<{ criteriaName: string; score: number }> = [];

        if (c.scoringCriteria.length > 0) {
          for (const cr of c.scoringCriteria) {
            const score = parseFloat(await ask(rl, `Score for "${cr.name}" (0–100, weight=${cr.weight}):`));
            criteriaScores.push({ criteriaName: cr.name, score });
          }
        } else {
          const score = parseFloat(await ask(rl, 'Overall score (0–100):'));
          criteriaScores = [{ criteriaName: 'overall', score }];
        }

        const updated = challengeService.scoreSubmission(sub.id, { judgeId, criteriaScores, rationale });
        Object.assign(sub, updated);
        ok(`Scored: total = ${green(String(updated.score?.totalScore ?? 0))}`);

        const unscored = S.submissions.filter((s) => s.challengeId === c.id && !s.score).length;
        if (unscored > 0) info(`${unscored} submission(s) still unscored.`);

      } else if (choice === '6') {
        const judging = S.challenges.filter((c) => c.status === 'judging');
        const c = await pickFrom(rl, 'Challenge in Judging', judging, (c) => `${b(c.title)}  ${gray(c.id)}`);
        if (!c) continue;
        Object.assign(c, challengeService.completeChallenge(c.id));
        ok(`"${b(c.title)}" is ${green('complete')}`);

      } else if (choice === '7') {
        const c = await pickFrom(rl, 'Challenge', S.challenges, (c) => `${b(c.title)}  [${c.status}]`);
        if (!c) continue;
        const board = challengeService.getLeaderboard(c.id);
        subHeader(`Leaderboard: ${c.title}  (${board.length} scored)`);
        if (!board.length) info('No scored submissions yet.');
        board.forEach((s, i) => {
          const p = S.participants.find((p) => p.id === s.participantId);
          console.log(`  ${gray(`#${i + 1}`)}  ${b(p?.handle ?? s.participantId).padEnd(22)} ${green(String(s.score?.totalScore ?? 0))} pts  ${gray(s.id)}`);
        });
        await pressEnter(rl);

      } else if (choice === '8') {
        if (S.challenges.length < 2) { warn('Need at least 2 challenges.'); continue; }
        const a = await pickFrom(rl, 'Challenge A', S.challenges, (c) => `${b(c.title)}  ${gray(c.id)}`);
        if (!a) continue;
        const bC = await pickFrom(rl, 'Challenge B', S.challenges, (c) => `${b(c.title)}  ${gray(c.id)}`);
        if (!bC) continue;
        const diff = challengeService.diffChallenges(a.id, bC.id);
        subHeader(`Diff: ${a.title}  vs  ${bC.title}`);
        kv('Title changed',    diff.titleChanged    ? yellow('yes') : green('no'));
        kv('Prompt changed',   diff.promptChanged   ? yellow('yes') : green('no'));
        kv('Deadline changed', diff.deadlineChanged ? yellow('yes') : green('no'));
        kv('Criteria added',   diff.criteriaAdded.length   ? green(diff.criteriaAdded.map((c) => c.name).join(', '))   : gray('none'));
        kv('Criteria removed', diff.criteriaRemoved.length ? red(diff.criteriaRemoved.map((c) => c.name).join(', '))   : gray('none'));
        await pressEnter(rl);
      }
    } catch (e) {
      fail((e as Error).message);
    }
  }
}

// ─── Showcase Menu ────────────────────────────────────────────────────────────
async function showcaseMenu(rl: RL) {
  while (true) {
    header('Showcase & Portfolio');

    const choice = await menu(rl, [
      { key: '1', label: 'Build Portfolio for Participant' },
      { key: '2', label: 'View Skill Signals' },
      { key: '3', label: 'Top Performers in League' },
      { key: '4', label: 'Showcase Feed for League' },
      { key: '0', label: dim('Back') },
    ]);

    if (choice === '0') return;

    try {
      if (choice === '1') {
        const p = await pickFrom(rl, 'Participant', S.participants, (p) => `${b(p.handle)}  [${p.discipline}]`);
        if (!p) continue;
        const portfolio = showcaseService.buildPortfolio(p.id);
        subHeader(`Portfolio: ${portfolio.handle}`);
        kv('Discipline',      portfolio.discipline);
        kv('Aggregate score', green(portfolio.aggregateScore.toFixed(2)));
        kv('Entries',         String(portfolio.entries.length));
        portfolio.entries.forEach((e, i) => {
          const score = e.score !== undefined ? green(` ${e.score}`) : dim(' unscored');
          const vis   = e.submission.isPublic ? green('public') : gray('private');
          console.log(`\n    ${gray(`${i + 1}.`)} ${b(e.challengeTitle)}  ${score}  [${vis}]`);
          console.log(`       ${gray('→')} ${dim(e.submission.artifact.url)}`);
        });
        if (!portfolio.entries.length) info('No submissions yet.');
        await pressEnter(rl);

      } else if (choice === '2') {
        const p = await pickFrom(rl, 'Participant', S.participants, (p) => `${b(p.handle)}  [${p.discipline}]`);
        if (!p) continue;
        const signals = showcaseService.getSkillSignals(p.id);
        subHeader(`Skill Signals: ${p.handle}`);
        if (!signals.length) info('No signals yet — need scored public submissions.');
        signals.forEach((s) =>
          console.log(`  ${b(s.domain)}: ${green(s.averageScore.toFixed(1))} avg  ${gray(`(${s.sampleCount} sample${s.sampleCount !== 1 ? 's' : ''})`)}`),
        );
        await pressEnter(rl);

      } else if (choice === '3') {
        const league = await pickFrom(rl, 'League', S.leagues, (l) => `${b(l.name)}  ${gray(l.id)}`);
        if (!league) continue;
        const n   = parseInt(await ask(rl, 'Show top N (e.g. 5):'), 10) || 5;
        const top = showcaseService.getTopPerformers(league.id, n);
        subHeader(`Top ${n} Performers — ${league.name}`);
        if (!top.length) info('No performers yet.');
        top.forEach((p, i) =>
          console.log(`  ${gray(`#${i + 1}`)}  ${b(p.handle).padEnd(22)} [${p.discipline}]  ${green(p.aggregateScore.toFixed(2))} pts  ${p.submissionCount} sub(s)`),
        );
        await pressEnter(rl);

      } else if (choice === '4') {
        const league = await pickFrom(rl, 'League', S.leagues, (l) => `${b(l.name)}  ${gray(l.id)}`);
        if (!league) continue;
        const feed = showcaseService.getShowcaseFeed(league.id);
        subHeader(`Showcase Feed — ${league.name}  (${feed.length} entries)`);
        if (!feed.length) info('No public entries yet.');
        feed.forEach((e) => {
          const score = e.score !== undefined ? green(` ${e.score.toFixed(1)} pts`) : '';
          console.log(`  ${b(e.participantHandle)}  ${gray('[' + e.discipline + ']')}  ${e.challengeTitle}${score}`);
        });
        await pressEnter(rl);
      }
    } catch (e) {
      fail((e as Error).message);
    }
  }
}

// ─── Sponsor Menu ─────────────────────────────────────────────────────────────
async function sponsorMenu(rl: RL) {
  while (true) {
    header('Sponsor Management');
    info(`${S.sponsors.length} sponsors  ${S.attachments.length} attachments`);
    console.log();

    const choice = await menu(rl, [
      { key: '1', label: 'Create Sponsor' },
      { key: '2', label: 'Attach Sponsor to Challenge' },
      { key: '3', label: 'Record Sponsor Outcome' },
      { key: '4', label: 'View Sponsor Summary' },
      { key: '0', label: dim('Back') },
    ]);

    if (choice === '0') return;

    try {
      if (choice === '1') {
        const name  = await ask(rl, 'Sponsor name:');
        const org   = await ask(rl, 'Organization:');
        const email = await ask(rl, 'Contact email:');
        const s = sponsorService.createSponsor({ name, organization: org, contactEmail: email });
        S.sponsors.push(s);
        ok(`Sponsor created: ${b(s.name)}  ${gray(s.id)}`);

      } else if (choice === '2') {
        const sponsor   = await pickFrom(rl, 'Sponsor',    S.sponsors,   (s) => `${b(s.name)} — ${s.organization}`);
        if (!sponsor) continue;
        const challenge = await pickFrom(rl, 'Challenge',  S.challenges, (c) => `${b(c.title)}  [${c.status}]`);
        if (!challenge) continue;
        const headline     = await ask(rl, 'Brief headline:');
        const description  = await ask(rl, 'Brief description:');
        const deliverables = (await ask(rl, 'Deliverables (comma-separated):')).split(',').map((d) => d.trim()).filter(Boolean);
        const prize        = await ask(rl, 'Prize (optional, Enter to skip):');
        const att = sponsorService.attachToChallenge(sponsor.id, challenge.id, {
          headline, description, deliverables, prize: prize || undefined,
        });
        S.attachments.push(att);
        ok(`Attached: ${b(sponsor.name)} → ${b(challenge.title)}  ${gray(att.id)}`);
        warn(`GAP: Challenge.sponsorId is still "${challenge.sponsorId ?? 'undefined'}" — attachToChallenge() does not update it.`);

      } else if (choice === '3') {
        const att = await pickFrom(rl, 'Attachment', S.attachments, (a) => {
          const s = S.sponsors.find((sp) => sp.id === a.sponsorId);
          const c = S.challenges.find((ch) => ch.id === a.challengeId);
          const outcome = a.outcome ? yellow(` [${a.outcome.status}]`) : '';
          return `${b(s?.name ?? a.sponsorId)} → ${b(c?.title ?? a.challengeId)}${outcome}  ${gray(a.id)}`;
        });
        if (!att) continue;
        console.log('\n  Status:');
        console.log(`    ${gray('[1]')} Pending`);
        console.log(`    ${gray('[2]')} Delivered`);
        console.log(`    ${gray('[3]')} Cancelled`);
        const sChoice = await ask(rl, 'Select:');
        const statusMap: Record<string, SponsorOutcomeStatus> = {
          '1': SponsorOutcomeStatus.Pending,
          '2': SponsorOutcomeStatus.Delivered,
          '3': SponsorOutcomeStatus.Cancelled,
        };
        const status = statusMap[sChoice] ?? SponsorOutcomeStatus.Pending;
        const notes  = await ask(rl, 'Notes (optional):');
        const updated = sponsorService.recordOutcome(att.id, { status, notes: notes || undefined });
        Object.assign(att, updated);
        ok(`Outcome recorded: ${yellow(status)}`);

      } else if (choice === '4') {
        const sponsor = await pickFrom(rl, 'Sponsor', S.sponsors, (s) => `${b(s.name)} — ${s.organization}`);
        if (!sponsor) continue;
        const summary = sponsorService.getSponsorSummary(sponsor.id);
        subHeader(`Sponsor Summary: ${sponsor.name}`);
        kv('Organization',       sponsor.organization);
        kv('Contact',            sponsor.contactEmail);
        kv('Challenges',         String(summary.challenges));
        kv('Top submissions',    String(summary.topSubmissions.length));
        summary.topSubmissions.forEach((sub, i) => {
          const p = S.participants.find((p) => p.id === sub.participantId);
          const score = sub.score ? green(String(sub.score.totalScore) + ' pts') : dim('unscored');
          console.log(`    ${gray(`${i + 1}.`)} ${b(p?.handle ?? sub.participantId)}  ${score}`);
        });
        await pressEnter(rl);
      }
    } catch (e) {
      fail((e as Error).message);
    }
  }
}

// ─── State View ───────────────────────────────────────────────────────────────
async function viewState(rl: RL) {
  header('Current System State');

  const section = (label: string, items: unknown[]) => {
    subHeader(`${label}  (${items.length})`);
    if (!items.length) info('none');
  };

  section('Hosts', S.hosts);
  S.hosts.forEach((h) => kv(h.id, `${b(h.name)} — ${h.organization}`));

  section('Seasons', S.seasons);
  S.seasons.forEach((s) => kv(s.id, `${b(s.name)}  (${s.startDate}→${s.endDate})`));

  section('Leagues', S.leagues);
  S.leagues.forEach((l) => kv(l.id, `${b(l.name)}  ${yellow(`[${l.status}]`)}`));

  section('Participants', S.participants);
  S.participants.forEach((p) => kv(p.id, `${b(p.handle)}  [${p.discipline}]`));

  section('Challenges', S.challenges);
  S.challenges.forEach((c) => kv(c.id, `${b(c.title)}  ${yellow(`[${c.status}]`)}  ${gray('league:' + c.leagueId)}`));

  section('Submissions', S.submissions);
  S.submissions.forEach((s) => {
    const p     = S.participants.find((p) => p.id === s.participantId);
    const score = s.score ? green(` (${s.score.totalScore} pts)`) : '';
    kv(s.id, `${b(p?.handle ?? s.participantId)}${score}  ${gray('→ ' + s.challengeId)}`);
  });

  section('Sponsors', S.sponsors);
  S.sponsors.forEach((s) => kv(s.id, `${b(s.name)} — ${s.organization}`));

  section('Sponsor Attachments', S.attachments);
  S.attachments.forEach((a) => {
    const outcome = a.outcome ? yellow(` [${a.outcome.status}]`) : '';
    kv(a.id, `${gray(a.sponsorId)} → ${gray(a.challengeId)}${outcome}`);
  });

  await pressEnter(rl);
}

// ─── Demo Workflow ────────────────────────────────────────────────────────────
async function runDemo(rl: RL) {
  header('Full Demo Workflow');
  console.log(`  Walks through a complete CSL scenario end-to-end:`);
  console.log(dim('  host → season → league → participants → challenge → sponsor'));
  console.log(dim('  → submissions → judging → scoring → leaderboard → showcase\n'));

  if (!await confirm(rl, 'Start demo? (builds sample data)')) return;

  // ── 1. League infrastructure
  subHeader('1 / 7  League Infrastructure');

  const host = leagueService.createLeagueHost({ name: 'Studio Zero', organization: 'Studio Zero LLC' });
  S.hosts.push(host);
  ok(`Host: ${b(host.name)}  ${gray(host.id)}`);

  const season = leagueService.createSeason({ name: 'Spring 2026', startDate: '2026-03-01', endDate: '2026-06-30' });
  S.seasons.push(season);
  ok(`Season: ${b(season.name)}  ${gray(season.id)}`);

  const league = leagueService.createLeague({ name: 'Open Design League', hostId: host.id, seasonId: season.id });
  S.leagues.push(league);
  ok(`League: ${b(league.name)}  status=${yellow(league.status)}  ${gray(league.id)}`);
  Object.assign(league, leagueService.activateLeague(league.id));
  ok(`League activated → status: ${green(league.status)}`);

  await pressEnter(rl);

  // ── 2. Participants
  subHeader('2 / 7  Participants');

  const seed = [
    { handle: '@alex_designs', discipline: Discipline.Design },
    { handle: '@kai_writes',   discipline: Discipline.Writing },
    { handle: '@sam_codes',    discipline: Discipline.Code },
  ];
  for (const input of seed) {
    const p = leagueService.createParticipant(input);
    S.participants.push(p);
    const result = leagueService.enrollParticipant(league.id, p.id);
    if (result.success) ok(`${b(p.handle)}  [${p.discipline}]  enrolled  ${gray(p.id)}`);
    else fail(`Enroll ${p.handle}: ${result.reason}`);
  }

  // Verify duplicate guard
  const dup = leagueService.enrollParticipant(league.id, S.participants[0]!.id);
  if (!dup.success) info(`Duplicate enrollment guard works: "${dup.reason}"`);

  await pressEnter(rl);

  // ── 3. Challenge + Sponsor
  subHeader('3 / 7  Challenge & Sponsor Brief');

  const sponsor = sponsorService.createSponsor({
    name: 'DesignFlow',
    organization: 'DesignFlow Inc.',
    contactEmail: 'briefs@designflow.io',
  });
  S.sponsors.push(sponsor);
  ok(`Sponsor: ${b(sponsor.name)}  ${gray(sponsor.id)}`);

  const challenge = challengeService.createChallenge({
    leagueId: league.id,
    title: 'Rebrand the Commute',
    prompt: 'Redesign the visual identity of public transit for a city of your choice.',
    deadline: '2026-04-30',
    scoringCriteria: [
      { name: 'Originality', weight: 0.4 },
      { name: 'Execution',   weight: 0.4 },
      { name: 'Clarity',     weight: 0.2 },
    ],
  });
  S.challenges.push(challenge);
  ok(`Challenge: ${b(challenge.title)}  status=${yellow(challenge.status)}  ${gray(challenge.id)}`);
  warn(`GAP [high]: League.challengeIds is still ${JSON.stringify(league.challengeIds)}.`);

  const attachment = sponsorService.attachToChallenge(sponsor.id, challenge.id, {
    headline: 'DesignFlow Brand Sprint',
    description: "We're looking for bold visual concepts for urban transit.",
    deliverables: ['Brand mark', 'Color palette', 'Typography spec'],
    prize: '$2,000 + internship consideration',
  });
  S.attachments.push(attachment);
  ok(`Sponsor attached: ${b(sponsor.name)} → ${b(challenge.title)}  ${gray(attachment.id)}`);
  warn(`GAP [high]: Challenge.sponsorId is still "${challenge.sponsorId ?? 'undefined'}" — not set by attachToChallenge().`);

  await pressEnter(rl);

  // ── 4. Submissions
  subHeader('4 / 7  Open Challenge & Submit Entries');

  Object.assign(challenge, challengeService.openChallenge(challenge.id));
  ok(`Challenge opened → status: ${green(challenge.status)}`);

  const artifacts = [
    'https://portfolio.alex.design/transit-rebrand',
    'https://notion.so/kai-transit-narrative',
    'https://github.com/sam/transit-design-system',
  ];
  for (let i = 0; i < S.participants.length; i++) {
    const p = S.participants[i]!;
    const sub = challengeService.submitEntry(challenge.id, p.id, {
      artifact: { url: artifacts[i]!, description: `${p.handle}'s entry` },
      isPublic: true,
    });
    S.submissions.push(sub);
    ok(`Submitted: ${b(p.handle)}  ${gray(sub.id)}`);
  }

  // Verify late-entry guard
  Object.assign(challenge, challengeService.closeForJudging(challenge.id));
  ok(`Challenge closed for judging → status: ${yellow(challenge.status)}`);
  try {
    challengeService.submitEntry(challenge.id, S.participants[0]!.id, {
      artifact: { url: 'late.example.com', description: 'Late attempt' },
    });
    fail('BUG: Should have rejected late entry!');
  } catch (e) {
    info(`Late-entry guard works: "${(e as Error).message}"`);
  }

  await pressEnter(rl);

  // ── 5. Scoring
  subHeader('5 / 7  Scoring');

  const rawScores = [
    { Originality: 85, Execution: 90, Clarity: 88 },
    { Originality: 78, Execution: 72, Clarity: 82 },
    { Originality: 92, Execution: 88, Clarity: 75 },
  ];
  for (let i = 0; i < S.submissions.length; i++) {
    const sub = S.submissions[i]!;
    const rs  = rawScores[i]!;
    const updated = challengeService.scoreSubmission(sub.id, {
      judgeId: 'judge-main',
      criteriaScores: [
        { criteriaName: 'Originality', score: rs.Originality },
        { criteriaName: 'Execution',   score: rs.Execution },
        { criteriaName: 'Clarity',     score: rs.Clarity },
      ],
      rationale: 'Strong concept with clear execution.',
    });
    Object.assign(sub, updated);
    ok(`${b(S.participants[i]!.handle)}: total = ${green(String(updated.score?.totalScore ?? 0))}`);
  }

  // Demonstrate multi-judge overwrite gap
  const firstSub = S.submissions[0]!;
  const beforeScore = firstSub.score?.totalScore;
  challengeService.scoreSubmission(firstSub.id, {
    judgeId: 'judge-2',
    criteriaScores: [
      { criteriaName: 'Originality', score: 60 },
      { criteriaName: 'Execution',   score: 65 },
      { criteriaName: 'Clarity',     score: 70 },
    ],
    rationale: 'Second judge — more critical view.',
  });
  Object.assign(firstSub, challengeService.getSubmission(firstSub.id));
  warn(`GAP [high]: Multi-judge overwrites score. @alex_designs: ${beforeScore} → ${firstSub.score?.totalScore} (judge-2 replaced judge-main).`);

  Object.assign(challenge, challengeService.completeChallenge(challenge.id));
  ok(`Challenge completed → status: ${green(challenge.status)}`);

  await pressEnter(rl);

  // ── 6. Results
  subHeader('6 / 7  Leaderboard & Showcase');

  const board = challengeService.getLeaderboard(challenge.id);
  console.log(`\n  ${b('Leaderboard')}  —  ${challenge.title}\n`);
  const medals = ['🥇', '🥈', '🥉'];
  board.forEach((s, i) => {
    const p = S.participants.find((p) => p.id === s.participantId);
    console.log(`  ${medals[i] ?? '  '}  ${b(p?.handle ?? s.participantId).padEnd(22)} ${green(String(s.score?.totalScore ?? 0))} pts`);
  });

  console.log(`\n  ${b('Top Performers')}\n`);
  showcaseService.getTopPerformers(league.id, 3).forEach((p, i) =>
    console.log(`  ${gray(`#${i + 1}`)}  ${b(p.handle).padEnd(22)} [${p.discipline}]  ${green(p.aggregateScore.toFixed(2))} avg`),
  );

  console.log(`\n  ${b('Showcase Feed')}\n`);
  showcaseService.getShowcaseFeed(league.id).forEach((e) => {
    const score = e.score !== undefined ? green(` ${e.score.toFixed(1)}`) : '';
    console.log(`  ${b(e.participantHandle)}  —  ${e.challengeTitle}${score}`);
  });

  await pressEnter(rl);

  // ── 7. Sponsor summary
  subHeader('7 / 7  Sponsor Summary');

  const summary = sponsorService.getSponsorSummary(sponsor.id);
  kv('Challenges sponsored', String(summary.challenges));
  kv('Top submissions',      String(summary.topSubmissions.length));
  summary.topSubmissions.forEach((sub) => {
    const p = S.participants.find((p) => p.id === sub.participantId);
    console.log(`    → ${b(p?.handle ?? sub.participantId)}  ${green(String(sub.score?.totalScore ?? 0))} pts`);
  });

  await pressEnter(rl);

  // ── Summary
  subHeader('Demo Complete');
  console.log(`\n  ${green('✓')}  All core workflows executed successfully.\n`);
  console.log(`  Gaps surfaced during this run:\n`);
  GAPS.filter((g) => g.severity === 'critical' || g.severity === 'high').forEach((g) => {
    const icon = g.severity === 'critical' ? red('●') : yellow('●');
    console.log(`    ${icon}  ${b(g.title)}  ${gray(`[${g.domain}]`)}`);
  });
  console.log(`\n  ${cyan('Tip:')} Choose ${b('"Gap Analysis Report"')} from the main menu for the full list.\n`);
  await pressEnter(rl);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  rl.on('close', () => process.exit(0));

  console.clear();
  console.log(`\n\x1b[36m\x1b[1m`);
  console.log('  ╔════════════════════════════════════════════════════╗');
  console.log('  ║   C R E A T I V E   S P O R T S   L E A G U E     ║');
  console.log('  ║   Interactive CLI Validator                        ║');
  console.log('  ╚════════════════════════════════════════════════════╝');
  console.log(`\x1b[0m`);
  console.log(`  ${gray('Exercises all domain services and surfaces implementation gaps.')}`);
  console.log(`  ${gray('Data is in-memory — resets on exit.')}\n`);

  while (true) {
    header('Main Menu');
    const choice = await menu(rl, [
      { key: '1', label: `${green('▶')}  Run Full Demo Workflow` },
      { key: '2', label: 'League Management' },
      { key: '3', label: 'Challenge Management' },
      { key: '4', label: 'Showcase & Portfolio' },
      { key: '5', label: 'Sponsor Management' },
      { key: '6', label: 'View System State' },
      { key: '7', label: `${yellow('⚠')}  Gap Analysis Report` },
      { key: '0', label: red('Exit') },
    ]);

    switch (choice) {
      case '1': await runDemo(rl);      break;
      case '2': await leagueMenu(rl);   break;
      case '3': await challengeMenu(rl); break;
      case '4': await showcaseMenu(rl); break;
      case '5': await sponsorMenu(rl);  break;
      case '6': await viewState(rl);    break;
      case '7': printGapReport(); await pressEnter(rl); break;
      case '0':
        console.log(`\n  ${green('Goodbye!')}\n`);
        rl.close();
        return;
      default:
        warn('Invalid choice — try again.');
    }
  }
}

main().catch((e) => {
  console.error(red('Fatal error:'), e);
  process.exit(1);
});
