/**
 * Get initials from a user object.
 * @param {Object} user - User object with first_name, last_name, username
 * @param {string} [fallback='?'] - Fallback character if no name available
 * @returns {string} Up to 2 uppercase initials (e.g. "TD")
 */
export function getInitials(user, fallback = '?') {
    const f = user?.first_name?.[0] || '';
    const l = user?.last_name?.[0]  || '';
    return (f + l).toUpperCase() || user?.username?.[0]?.toUpperCase() || fallback;
}
