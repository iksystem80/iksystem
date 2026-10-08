import { checkmatcheligibility } from '@/api/customer';

function plural(value, singular, pluralValue = `${singular}s`) {
  return Number(value) === 1 ? singular : pluralValue;
}

export function formatRemainingMinutes(totalMinutes) {
  const minutes = Math.max(0, Number(totalMinutes || 0));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours} ${plural(hours, 'hour')} ${remainingMinutes} ${plural(remainingMinutes, 'minute')}`;
  }

  if (hours > 0) {
    return `${hours} ${plural(hours, 'hour')}`;
  }

  return `${remainingMinutes} ${plural(remainingMinutes, 'minute')}`;
}

export function formatMatchTime(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

export function matchEligibilityMessage(data) {
  if (!data || !data.ruleEnabled || data.eligible) {
    return '';
  }

  if (data.reasonCode === 'COOLDOWN') {
    const time = formatMatchTime(data.cooldownUntil);
    const remaining = formatRemainingMinutes(data.cooldownRemainingMinutes);

    return time
      ? `Match cooldown active. Customer can receive another Match at ${time} (${remaining} remaining).`
      : `Match cooldown active. ${remaining} remaining.`;
  }

  if (data.reasonCode === 'SHIFT_LIMIT') {
    return 'Customer already received a Match in this shift. Wait until the next shift.';
  }

  if (data.reasonCode === 'DAILY_LIMIT') {
    return `Customer reached the daily Match limit (${data.dailyLimit}).`;
  }

  return data.message || 'Customer is not currently eligible for Match.';
}

export async function getMatchEligibility(customerId, locationId) {
  const response = await checkmatcheligibility(customerId, locationId);

  return response?.data || {
    ruleEnabled: false,
    eligible: true
  };
}
