/**
 * Calculate distance between two coordinates using the Haversine formula.
 * Returns distance in miles.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance for display.
 * e.g., "0.3 miles", "1.2 miles"
 */
export function formatDistance(miles: number): string {
  return `${miles.toFixed(1)} miles`;
}

/**
 * Get busyness indicator color based on percentage.
 * Green: 0-50% (comfortable)
 * Amber: 51-79% (getting busy)
 * Red: 80-100% (packed)
 */
export function getBusynessColor(percentage: number): string {
  if (percentage <= 50) return 'green';
  if (percentage <= 79) return 'amber';
  return 'red';
}

/**
 * Generate social proof message based on busyness level.
 * Simulates "X others are here" counts.
 */
export function generateSocialProof(busynessPercentage: number): {
  count: number;
  names: string[];
  message: string;
} {
  const mockNames = ['Sarah', 'Mike', 'Emma', 'Alex', 'James', 'Olivia', 'Daniel', 'Sophie'];
  let count: number;

  if (busynessPercentage <= 33) {
    count = 2 + Math.floor(Math.random() * 4); // 2-5
  } else if (busynessPercentage <= 66) {
    count = 10 + Math.floor(Math.random() * 16); // 10-25
  } else {
    count = 30 + Math.floor(Math.random() * 51); // 30-80
  }

  const displayNames = mockNames.slice(0, 2);
  const othersCount = count - displayNames.length;

  return {
    count,
    names: displayNames,
    message: `${displayNames.join(', ')} & ${othersCount} others are here`,
  };
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
