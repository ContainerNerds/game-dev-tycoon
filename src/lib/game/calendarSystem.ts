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
  let totalIncome = 0;
  let employeeCosts = 0;
  let computeCosts = 0;
  let devOverheadCosts = 0;

  // Employee salaries
  for (const emp of state.employees) {
    lineItems.push({ label: `Salary: ${emp.name}`, amount: -emp.monthlySalary });
    employeeCosts += emp.monthlySalary;
  }

  // Office overhead
  if (state.office.monthlyOverhead > 0) {
    lineItems.push({ label: 'Office overhead', amount: -state.office.monthlyOverhead });
    devOverheadCosts += state.office.monthlyOverhead;
  }

  // Server costs
  if (state.currentGame) {
    for (const server of state.currentGame.servers) {
      lineItems.push({
        label: `Server (${server.regionId}, ${server.type})`,
        amount: -server.monthlyCost,
      });
      computeCosts += server.monthlyCost;
    }
  }

  // Income is tracked cumulatively in the game — for the monthly report
  // we report the last month's total revenue separately via the game loop.
  // Here we just capture the cost side. Income line items are added by the
  // game loop before displaying the report.

  const netCashFlow = totalIncome - employeeCosts - computeCosts - devOverheadCosts;

  // Determine which month this report is for (the month that just ended)
  const reportMonth = state.calendar.month === 1 ? 12 : state.calendar.month - 1;
  const reportYear = state.calendar.month === 1 ? state.calendar.year - 1 : state.calendar.year;

  return {
    month: reportMonth,
    year: reportYear,
    income: totalIncome,
    employeeCosts,
    computeCosts,
    devOverheadCosts,
    netCashFlow,
    lineItems,
  };
}

export function getTotalMonthlyCosts(state: StudioState): number {
  let total = 0;
  for (const emp of state.employees) {
    total += emp.monthlySalary;
  }
  total += state.office.monthlyOverhead;
  if (state.currentGame) {
    for (const server of state.currentGame.servers) {
      total += server.monthlyCost;
    }
  }
  return total;
}
