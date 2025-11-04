import { differenceInCalendarDays, isAfter, isBefore, isValid, startOfDay } from 'date-fns';

import type { VehicleStatus } from '@/db/schema';

export type InsuranceStatus = 'active' | 'expiring' | 'expired';
export type TachographStatus = 'ok' | 'soon' | 'overdue' | 'missing';
export type CopieConformaStatus = 'ok' | 'soon' | 'overdue' | 'missing';

export function computeVehicleStatus(params: {
  nextRevisionDate: Date | string | null;
  nextRevisionAtKm: number | null;
  currentOdometerKm: number;
}): VehicleStatus {
  const { nextRevisionDate, nextRevisionAtKm, currentOdometerKm } = params;

  // Convert string to Date object if needed
  const revisionDateObj = nextRevisionDate
    ? typeof nextRevisionDate === 'string'
      ? new Date(nextRevisionDate)
      : nextRevisionDate
    : null;

  const daysUntilRevision = revisionDateObj && isValid(revisionDateObj)
    ? differenceInCalendarDays(startOfDay(revisionDateObj), startOfDay(new Date()))
    : null;

  const kmsUntilRevision =
    typeof nextRevisionAtKm === 'number' ? nextRevisionAtKm - currentOdometerKm : null;

  const overdueByDate = typeof daysUntilRevision === 'number' && daysUntilRevision < 0;
  const overdueByKm = typeof kmsUntilRevision === 'number' && kmsUntilRevision < 0;

  if (overdueByDate || overdueByKm) {
    return 'OVERDUE';
  }

  const dueSoonByDate = typeof daysUntilRevision === 'number' && daysUntilRevision <= 14;
  const dueSoonByKm = typeof kmsUntilRevision === 'number' && kmsUntilRevision <= 1000;

  if (dueSoonByDate || dueSoonByKm) {
    return 'DUE_SOON';
  }

  return 'OK';
}

export function computeInsuranceStatus(endDate: Date | string | null): InsuranceStatus {
  if (!endDate) {
    return 'expired';
  }

  // Convert string to Date object if needed
  const dateObj = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (!isValid(dateObj)) {
    return 'expired';
  }

  // Compare only dates, not times
  const endDateStart = startOfDay(dateObj);
  const todayStart = startOfDay(new Date());

  if (isBefore(endDateStart, todayStart)) {
    return 'expired';
  }

  const days = differenceInCalendarDays(endDateStart, todayStart);

  if (days <= 30) {
    return 'expiring';
  }

  return 'active';
}

export function computeTachographStatus(date: Date | string | null): TachographStatus {
  if (!date) {
    return 'missing';
  }

  // Convert string to Date object if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (!isValid(dateObj)) {
    return 'missing';
  }

  // Compare only dates, not times
  const checkDateStart = startOfDay(dateObj);
  const todayStart = startOfDay(new Date());

  if (isBefore(checkDateStart, todayStart)) {
    return 'overdue';
  }

  const days = differenceInCalendarDays(checkDateStart, todayStart);

  if (days <= 30) {
    return 'soon';
  }

  return 'ok';
}

export function computeCopieConformaStatus(expiryDate: Date | string | null): CopieConformaStatus {
  if (!expiryDate) {
    return 'missing';
  }

  // Convert string to Date object if needed
  const dateObj = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;

  if (!isValid(dateObj)) {
    return 'missing';
  }

  // Compare only dates, not times
  const expiryDateStart = startOfDay(dateObj);
  const todayStart = startOfDay(new Date());

  if (isBefore(expiryDateStart, todayStart)) {
    return 'overdue';
  }

  const days = differenceInCalendarDays(expiryDateStart, todayStart);

  if (days <= 30) {
    return 'soon';
  }

  return 'ok';
}

export function shouldTriggerTachographReminder(date: Date | string | null, leadDays = 30): boolean {
  if (!date) {
    return false;
  }

  // Convert string to Date object if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (!isValid(dateObj)) {
    return false;
  }

  const today = new Date();
  const triggerDate = new Date(dateObj);
  triggerDate.setDate(triggerDate.getDate() - leadDays);

  return !isAfter(today, dateObj) && !isBefore(today, triggerDate);
}

