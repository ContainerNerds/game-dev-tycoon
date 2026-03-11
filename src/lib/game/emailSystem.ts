import type {
  GameEmail,
  CalendarState,
  MonthlyReport,
  ActiveGame,
  Employee,
  StudioState,
} from './types';
import { getMonthName } from './calendarSystem';
import {
  EMAIL_SENDERS,
  FAN_MAIL_TEMPLATES,
  HATE_MAIL_TEMPLATES,
  INVESTMENT_TEMPLATES,
  EMAIL_CONFIG,
} from '@/lib/config/emailConfig';

function generateId(): string {
  return `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function calendarTimestamp(cal: CalendarState) {
  return { year: cal.year, month: cal.month, day: cal.day };
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}

// ============================================================
// Monthly Report Email
// ============================================================

export function generateMonthlyReportEmail(
  report: MonthlyReport,
  calendar: CalendarState,
): GameEmail {
  const monthName = getMonthName(report.month);
  const lines = [
    `Monthly Financial Report — ${monthName} ${report.year}`,
    '',
    `Revenue:  $${report.income.toLocaleString()}`,
    `Employee costs:  -$${report.employeeCosts.toLocaleString()}`,
    `Compute costs:  -$${report.computeCosts.toLocaleString()}`,
    `Overhead:  -$${report.devOverheadCosts.toLocaleString()}`,
    '',
    `Net cash flow:  ${report.netCashFlow >= 0 ? '+' : ''}$${report.netCashFlow.toLocaleString()}`,
  ];

  if (report.lineItems.length > 0) {
    lines.push('', '--- Details ---');
    for (const item of report.lineItems) {
      const sign = item.amount >= 0 ? '+' : '';
      lines.push(`  ${item.label}: ${sign}$${item.amount.toLocaleString()}`);
    }
  }

  return {
    id: generateId(),
    type: 'monthly-report',
    subject: `${monthName} ${report.year} Financial Report`,
    body: lines.join('\n'),
    sender: pickRandom(EMAIL_SENDERS['monthly-report']),
    priority: report.netCashFlow < 0 ? 'high' : 'normal',
    read: false,
    timestamp: calendarTimestamp(calendar),
  };
}

// ============================================================
// Game Review Email
// ============================================================

export function generateGameReviewEmail(
  game: ActiveGame,
  calendar: CalendarState,
): GameEmail {
  const lines = [
    `Review scores for "${game.name}":`,
    '',
  ];

  for (const review of game.blogReviews) {
    lines.push(`${review.blogName}: ${review.score.toFixed(1)}/10 — "${review.summary}"`);
  }

  lines.push('', `Overall score: ${game.reviewScore.toFixed(1)}/10`);

  return {
    id: generateId(),
    type: 'game-review',
    subject: `Reviews are in for "${game.name}" — ${game.reviewScore.toFixed(1)}/10`,
    body: lines.join('\n'),
    sender: pickRandom(EMAIL_SENDERS['game-review']),
    priority: game.reviewScore >= 8 ? 'high' : 'normal',
    read: false,
    timestamp: calendarTimestamp(calendar),
    metadata: { gameId: game.id, reviewScore: game.reviewScore },
  };
}

// ============================================================
// Fan Mail
// ============================================================

export function generateFanMail(
  gameName: string,
  calendar: CalendarState,
): GameEmail {
  const template = pickRandom(FAN_MAIL_TEMPLATES);
  const vars = { gameName };

  return {
    id: generateId(),
    type: 'fan-mail',
    subject: fillTemplate(template.subject, vars),
    body: fillTemplate(template.body, vars),
    sender: pickRandom(EMAIL_SENDERS['fan-mail']),
    priority: 'low',
    read: false,
    timestamp: calendarTimestamp(calendar),
    metadata: { gameName },
  };
}

// ============================================================
// Hate Mail
// ============================================================

export function generateHateMail(
  gameName: string,
  calendar: CalendarState,
): GameEmail {
  const template = pickRandom(HATE_MAIL_TEMPLATES);
  const vars = { gameName };

  return {
    id: generateId(),
    type: 'hate-mail',
    subject: fillTemplate(template.subject, vars),
    body: fillTemplate(template.body, vars),
    sender: pickRandom(EMAIL_SENDERS['hate-mail']),
    priority: 'low',
    read: false,
    timestamp: calendarTimestamp(calendar),
    metadata: { gameName },
  };
}

// ============================================================
// Employee Quit Email
// ============================================================

export function generateEmployeeQuitEmail(
  employee: Employee,
  calendar: CalendarState,
): GameEmail {
  return {
    id: generateId(),
    type: 'employee-quit',
    subject: `${employee.name} has resigned`,
    body: `We regret to inform you that ${employee.name} (${employee.title}) has decided to leave the studio. Their last day is effective immediately. We wish them the best in their future endeavors.`,
    sender: pickRandom(EMAIL_SENDERS['employee-quit']),
    priority: 'high',
    read: false,
    timestamp: calendarTimestamp(calendar),
    metadata: { employeeId: employee.id, employeeName: employee.name },
  };
}

// ============================================================
// Employee Vacation Email
// ============================================================

export function generateEmployeeVacationEmail(
  employee: Employee,
  calendar: CalendarState,
): GameEmail {
  return {
    id: generateId(),
    type: 'employee-vacation',
    subject: `${employee.name} is going on vacation`,
    body: `${employee.name} (${employee.title}) has started their scheduled vacation. They will return in ${employee.vacationDaysLeft} days. Their tasks have been unassigned.`,
    sender: pickRandom(EMAIL_SENDERS['employee-vacation']),
    priority: 'normal',
    read: false,
    timestamp: calendarTimestamp(calendar),
    metadata: { employeeId: employee.id, employeeName: employee.name },
  };
}

// ============================================================
// Investment Opportunity Email
// ============================================================

export function generateInvestmentEmail(
  studioName: string,
  calendar: CalendarState,
): GameEmail {
  const template = pickRandom(INVESTMENT_TEMPLATES);
  const amount = (Math.floor(Math.random() * 10) + 1) * 50_000;
  const vars = {
    studioName,
    amount: amount.toLocaleString(),
  };

  return {
    id: generateId(),
    type: 'investment-opportunity',
    subject: fillTemplate(template.subject, vars),
    body: fillTemplate(template.body, vars),
    sender: pickRandom(EMAIL_SENDERS['investment-opportunity']),
    priority: 'normal',
    read: false,
    timestamp: calendarTimestamp(calendar),
    metadata: { investmentAmount: amount },
  };
}

// ============================================================
// Server Alert Email
// ============================================================

export function generateServerAlertEmail(
  regionId: string,
  loadPercent: number,
  calendar: CalendarState,
): GameEmail {
  return {
    id: generateId(),
    type: 'server-alert',
    subject: `High server load in ${regionId} (${Math.round(loadPercent * 100)}%)`,
    body: `Our monitoring systems have detected that servers in the ${regionId} region are running at ${Math.round(loadPercent * 100)}% capacity. If load continues to increase, players may experience degraded performance or connection issues. Consider adding more server capacity in this region.`,
    sender: pickRandom(EMAIL_SENDERS['server-alert']),
    priority: loadPercent >= 0.95 ? 'urgent' : 'high',
    read: false,
    timestamp: calendarTimestamp(calendar),
    metadata: { regionId, loadPercent },
  };
}

// ============================================================
// Random email roll (called once per day from game loop)
// ============================================================

export interface RandomEmailResult {
  fanMail: GameEmail | null;
  hateMail: GameEmail | null;
  investmentEmail: GameEmail | null;
}

export function rollRandomEmails(
  state: StudioState,
  isMonthEnd: boolean,
): RandomEmailResult {
  const result: RandomEmailResult = {
    fanMail: null,
    hateMail: null,
    investmentEmail: null,
  };

  if (state.activeGames.length === 0) return result;

  const totalFans = state.studioFans + state.activeGames.reduce((sum, g) => sum + g.gameFans, 0);
  const fanMailChance = Math.min(
    EMAIL_CONFIG.fanMailMaxChance,
    EMAIL_CONFIG.fanMailBaseChance + (totalFans / 1000) * EMAIL_CONFIG.fanMailChancePerThousandFans,
  );
  if (Math.random() < fanMailChance) {
    const game = pickRandom(state.activeGames);
    result.fanMail = generateFanMail(game.name, state.calendar);
  }

  const totalBugs = state.activeGames.reduce((sum, g) => sum + g.bugs.length, 0);
  const hateMailChance = Math.min(
    EMAIL_CONFIG.hateMailMaxChance,
    EMAIL_CONFIG.hateMailBaseChance + totalBugs * EMAIL_CONFIG.hateMailChancePerBug,
  );
  if (Math.random() < hateMailChance) {
    const game = pickRandom(state.activeGames);
    result.hateMail = generateHateMail(game.name, state.calendar);
  }

  if (
    isMonthEnd &&
    state.totalLifetimeMoney >= EMAIL_CONFIG.investmentMinLifetimeRevenue &&
    Math.random() < EMAIL_CONFIG.investmentChancePerMonth
  ) {
    result.investmentEmail = generateInvestmentEmail(state.studioName, state.calendar);
  }

  return result;
}
