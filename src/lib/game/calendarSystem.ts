import type { CalendarState, MonthlyReport, MonthlyReportLineItem, StudioState } from './types';
import { CALENDAR_CONFIG } from '@/lib/config/calendarConfig';

export function getMonthName(month: number): string {
  const names = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return names[month] ?? '';
}

export function formatDate(cal: CalendarState): string {
  return `${getMonthName(cal.month)} ${cal.day}, ${cal.year}`;
}

export function formatDateTime(cal: CalendarState): string {
  const hour = cal.hour.toString().padStart(2, '0');
  return `${formatDate(cal)} ${hour}:00`;
}

export function getDaysInMonth(month: number): number {
  return CALENDAR_CONFIG.daysInMonth[month] ?? 30;
}

export function buildMonthlyReport(state: StudioState): MonthlyReport {
  const lineItems: MonthlyReportLineItem[] = [];
  let employeeCosts = 0;
  let computeCosts = 0;
  let devOverheadCosts = 0;

  for (const emp of state.employees) {
    if (emp.monthlySalary > 0) {
      lineItems.push({ label: `Salary: ${emp.name}`, amount: -emp.monthlySalary });
      employeeCosts += emp.monthlySalary;
    }
  }

  if (state.office.monthlyOverhead > 0) {
    lineItems.push({ label: 'Office overhead', amount: -state.office.monthlyOverhead });
    devOverheadCosts += state.office.monthlyOverhead;
  }

  // Studio-wide server costs
  for (const server of state.servers) {
    lineItems.push({
      label: `Server (${server.regionId}, ${server.type})`,
      amount: -server.monthlyCost,
    });
    computeCosts += server.monthlyCost;
  }
  for (const rack of state.racks) {
    if (rack.monthlyCost > 0) {
      lineItems.push({ label: `Rack lease (${rack.regionId})`, amount: -rack.monthlyCost });
      computeCosts += rack.monthlyCost;
    }
  }

  const reportMonth = state.calendar.month === 1 ? 12 : state.calendar.month - 1;
  const reportYear = state.calendar.month === 1 ? state.calendar.year - 1 : state.calendar.year;

  return {
    month: reportMonth,
    year: reportYear,
    income: 0,
    employeeCosts,
    computeCosts,
    devOverheadCosts,
    netCashFlow: 0,
    lineItems,
  };
}

export function getTotalMonthlyCosts(state: StudioState): number {
  let total = 0;
  for (const emp of state.employees) total += emp.monthlySalary;
  total += state.office.monthlyOverhead;
  for (const server of state.servers) total += server.monthlyCost;
  for (const rack of state.racks) total += rack.monthlyCost;
  return total;
}
