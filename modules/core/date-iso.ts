import * as DateFns from "date-fns";
import { Brand } from "helpers";
import { range, reverse, values, groupBy } from "lodash-es";

export type Type = Brand<string, "ISO8601Date">;
export type DateTense = "today" | "past" | "future";
export const VALID_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

function validateAndParse(date: Type): Date {
  if (process.env.NODE_ENV !== "production" && !VALID_REGEX.test(date)) {
    throw new Error(`Invalid IsoDate ${date}`);
  }
  return DateFns.parseISO(date);
}

export function parseToDate(date: Type): Date {
  return validateAndParse(date);
}

export function differenceInDays(a: Type, b: Type): number {
  return DateFns.differenceInCalendarDays(
    validateAndParse(a),
    validateAndParse(b)
  );
}

export function tomorrow(): Type {
  return addDays(today(), 1);
}

export function lastWeek(): Type {
  return addDays(today(), -7);
}

export function nextWeek(): Type {
  return addDays(today(), 7);
}

export function yesterday(): Type {
  return addDays(today(), -1);
}

export function today(): Type {
  return toIsoDate(new Date());
}

export function toIsoDate(date: Date | string): Type {
  date = typeof date === "string" ? DateFns.parseISO(date) : date;
  return DateFns.format(date, "yyyy-MM-dd") as Type;
}

export function isValid(date: Date | string): boolean {
  date = typeof date === "string" ? DateFns.parseISO(date) : date;
  return DateFns.isValid(date);
}

export function toShortDayDate(date: Type): string {
  return DateFns.format(validateAndParse(date), "E M/d/yyyy");
}

export function toShortDayDateMonth(date: Type): string {
  return DateFns.format(validateAndParse(date), "E M/d");
}
export function toLongDay(date: Type): string {
  return DateFns.format(validateAndParse(date), "EEEE");
}

export function toMonthAndDay(date: Type): string {
  return DateFns.format(validateAndParse(date), "M/d");
}
export function toDateWithMonthDay(date: Type, monthDay: number) {
  return toIsoDate(DateFns.setDate(new Date(date), monthDay));
}

export function toMonthAndDate(date: Type): string {
  return DateFns.format(validateAndParse(date), "MMMM d");
}

export function toShortMonthAndDate(date: Type): string {
  return DateFns.format(validateAndParse(date), "MMM d");
}

export function formatLongForm(date: Type): string {
  return DateFns.format(validateAndParse(date), "E, MMMM d, yyyy");
}
export function formatLongFormFullDay(date: Type): string {
  return DateFns.format(validateAndParse(date), "EEEE, MMMM d, yyyy");
}

export function formatLongDayAndMonth(date: Type): string {
  return DateFns.format(validateAndParse(date), "EEEE, MMMM d");
}

export function formatShortDayAndLongMonth(date: Type): string {
  return DateFns.format(validateAndParse(date), "E, MMMM d");
}

export function formatLongDayMonthYear(date: Type): string {
  return DateFns.format(
    validateAndParse(toIsoDate(date)),
    "EEEE, MMMM d, yyyy"
  );
}

export function getMonthAndYearFromIsoDate(date: Type): string {
  return DateFns.format(validateAndParse(date), "yyyy-MM");
}

export function eachDay(
  startDate: Type,
  endDate: Type,
  order?: "asc" | "desc"
) {
  const start = validateAndParse(startDate);
  const end = validateAndParse(endDate);

  return order && order === "asc"
    ? reverse(DateFns.eachDayOfInterval({ start, end }).map(toIsoDate))
    : DateFns.eachDayOfInterval({ start, end }).map(toIsoDate);
}

export function areEqual(today: Type, date: Type): boolean {
  return DateFns.isEqual(validateAndParse(today), validateAndParse(date));
}

export function isTomorrow(today: Type, date: Type): boolean {
  const tomorrow = DateFns.addDays(validateAndParse(today), 1);
  return DateFns.isSameDay(tomorrow, validateAndParse(date));
}

/**
 * Sunday is 0, Saturday is 6
 */
export function getWeekDayFromIsoDate(date: Type): number {
  return DateFns.getDay(validateAndParse(date));
}

export function isWeekend(date: Type): boolean {
  return DateFns.isWeekend(validateAndParse(date));
}

export function getMonthDayFromIsoDate(date: Type): number {
  return DateFns.getDate(validateAndParse(date));
}

export function getMonthAndDayFromIsoDate(date: Type): string {
  return DateFns.format(validateAndParse(date), "MMM d");
}

export function getYearFromIsoDate(date: Type): number {
  return parseInt(date.slice(0, 4), 10);
}

export function distanceInWords(a: Type, b: Type): string {
  return DateFns.formatDistance(validateAndParse(a), validateAndParse(b));
}

export function addMonths(date: Type, numMonths: number): Type {
  return toIsoDate(DateFns.addMonths(validateAndParse(date), numMonths));
}

export function addYears(date: Type, numYears: number): Type {
  return toIsoDate(DateFns.addYears(validateAndParse(date), numYears));
}

export function addDays(date: Type, numDays: number): Type {
  return toIsoDate(DateFns.addDays(validateAndParse(date), numDays));
}

function getCalendarWeekNumberFromDate(
  _date: Type,
  _firstDayOfMonth: Type,
  _sundayBeforeFirstDayOfMonth: Type
): number {
  const date = validateAndParse(_date);
  const firstDayOfMonth = validateAndParse(_firstDayOfMonth);
  const sundayBeforeFirstDayOfMonth = validateAndParse(
    _sundayBeforeFirstDayOfMonth
  );

  if (DateFns.isSameMonth(date, firstDayOfMonth)) {
    return Math.floor(
      DateFns.differenceInDays(date, sundayBeforeFirstDayOfMonth) / 7
    );
  } else if (DateFns.isAfter(date, firstDayOfMonth)) {
    return DateFns.differenceInCalendarWeeks(date, firstDayOfMonth);
  }
  return 0;
}

export function getDateTense(date: Type, currentDate: Type): DateTense {
  if (date == currentDate) {
    return "today";
  } else if (date.localeCompare(currentDate) > 0) {
    return "future";
  }
  return "past";
}

interface DateObj {
  date: Type;
}

export function dateIso(
  literals: TemplateStringsArray,
  ...placeholders: never[]
) {
  if (literals.length != 1) {
    throw new Error("One parameter only, please.");
  }
  const date = literals[0];
  if (!VALID_REGEX.test(date)) {
    throw new Error(`Invalid IsoDate ${date}`);
  }
  return date as Type;
}

export function compare(a: Type, b: Type): number {
  return a.localeCompare(b);
}

export const descendingYearMonthAscendingDateComparator = (
  _a: Type,
  _b: Type
) => {
  const a = validateAndParse(_a);
  const b = validateAndParse(_b);
  return (
    DateFns.getYear(b) - DateFns.getYear(a) ||
    DateFns.getMonth(b) - DateFns.getMonth(a) ||
    DateFns.getDate(a) - DateFns.getDate(b)
  );
};

export function* iterateDates(
  start: Type,
  opts: { end?: Type; step?: number } = {}
) {
  const { end, step } = { step: 1, ...opts };
  let date = start;
  while (!end || compare(date, end) !== 1) {
    yield date;
    date = addDays(date, step);
  }
}
