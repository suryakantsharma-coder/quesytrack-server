/**
 * Reusable date range utility for dashboard filters.
 * Filter is applied against createdAt field.
 * Supported: yesterday, 7days, 30days (default), 6months, 1year
 */

export const VALID_FILTERS = ['yesterday', '7days', '30days', '6months', '1year'];
export const DEFAULT_FILTER = '30days';

/**
 * Validate filter value. Returns valid filter or default.
 * @param {string} [filter] - Raw query value
 * @returns {string} Valid filter key
 */
export function validateFilter(filter) {
  if (!filter || typeof filter !== 'string') return DEFAULT_FILTER;
  const normalized = String(filter).trim().toLowerCase();
  return VALID_FILTERS.includes(normalized) ? normalized : DEFAULT_FILTER;
}

/**
 * Get startDate and endDate for the given filter.
 * endDate is end of day (23:59:59.999); startDate is start of day (00:00:00.000).
 * @param {string} filter - One of VALID_FILTERS
 * @returns {{ startDate: Date, endDate: Date }}
 */
export function getDateRange(filter) {
  const valid = validateFilter(filter);
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  let startDate;

  switch (valid) {
    case 'yesterday': {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      startDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const endDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      return { startDate, endDate };
    }
    case '7days': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      startDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      return { startDate, endDate: endOfToday };
    }
    case '30days': {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      startDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      return { startDate, endDate: endOfToday };
    }
    case '6months': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      startDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      return { startDate, endDate: endOfToday };
    }
    case '1year': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      startDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      return { startDate, endDate: endOfToday };
    }
    default: {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      startDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      return { startDate, endDate: endOfToday };
    }
  }
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format aggregation _id { year, month } to short label "Jan" / "Feb" etc.
 * @param {{ year: number, month: number }} id
 * @returns {string}
 */
export function monthLabel(id) {
  if (!id || id.month == null) return 'Unknown';
  return MONTH_LABELS[Number(id.month) - 1] || 'Unknown';
}
