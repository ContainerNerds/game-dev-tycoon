import type { GameNotification, GameEmail, CalendarState } from './types';

function generateId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function calendarTimestamp(cal: CalendarState) {
  return { year: cal.year, month: cal.month, day: cal.day };
}

export function createEmailNotification(
  email: GameEmail,
  calendar: CalendarState,
): GameNotification {
  const titleMap: Partial<Record<GameEmail['type'], string>> = {
    'game-review': 'New Game Review',
    'fan-mail': 'Fan Mail',
    'hate-mail': 'Hate Mail',
    'employee-quit': 'Employee Resigned',
    'employee-vacation': 'Employee on Vacation',
    'monthly-report': 'Monthly Report',
    'investment-opportunity': 'Investment Opportunity',
    'server-alert': 'Server Alert',
  };

  return {
    id: generateId(),
    type: 'new-email',
    title: titleMap[email.type] ?? 'New Email',
    message: email.subject,
    timestamp: calendarTimestamp(calendar),
    dismissed: false,
    emailId: email.id,
  };
}

export function createServerOverloadNotification(
  regionId: string,
  loadPercent: number,
  calendar: CalendarState,
): GameNotification {
  return {
    id: generateId(),
    type: 'server-overload',
    title: 'Server Overload',
    message: `${regionId} region at ${Math.round(loadPercent * 100)}% capacity`,
    timestamp: calendarTimestamp(calendar),
    dismissed: false,
  };
}

export function createMoneyWarningNotification(
  money: number,
  calendar: CalendarState,
): GameNotification {
  return {
    id: generateId(),
    type: 'money-warning',
    title: 'Low Funds Warning',
    message: `Studio balance is critically low: $${Math.floor(money).toLocaleString()}`,
    timestamp: calendarTimestamp(calendar),
    dismissed: false,
  };
}
