import dayjs from "dayjs";

/**
 * Returns the precise Start and End dates for a "Semester" query preset.
 * CMU Typical Semester Bounds:
 * - Semester 1: June 1 -> October 31
 * - Semester 2: November 1 -> March 31 (extends to next year)
 * - Summer: April 1 -> May 31
 */
export function getCurrentSemesterRange(): { startDate: Date; endDate: Date } {
  const currentMonth = dayjs().month(); // 0 = Jan, 11 = Dec
  let currentYear = dayjs().year();

  let startDate: dayjs.Dayjs;
  let endDate: dayjs.Dayjs;

  if (currentMonth >= 5 && currentMonth <= 9) {
    // Semester 1 (June to October)
    startDate = dayjs().year(currentYear).month(5).date(1).startOf("day");
    endDate = dayjs().year(currentYear).month(9).date(31).endOf("day");
  } else if (currentMonth >= 10) {
    // Semester 2 (November to December)
    startDate = dayjs().year(currentYear).month(10).date(1).startOf("day");
    endDate = dayjs().year(currentYear + 1).month(2).date(31).endOf("day");
  } else if (currentMonth <= 2) {
    // Semester 2 (January to March)
    startDate = dayjs().year(currentYear - 1).month(10).date(1).startOf("day");
    endDate = dayjs().year(currentYear).month(2).date(31).endOf("day");
  } else {
    // Summer (April to May)
    startDate = dayjs().year(currentYear).month(3).date(1).startOf("day");
    endDate = dayjs().year(currentYear).month(4).date(31).endOf("day"); // May 31
  }

  return {
    startDate: startDate.toDate(),
    endDate: endDate.toDate(),
  };
}
