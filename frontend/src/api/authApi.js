import apiFetch from './httpClient';

const ACCOUNTS_BASE = '/accounts';

export async function login({ username_or_email, password }) {
	const data = await apiFetch(`${ACCOUNTS_BASE}/login/`, {
		method: 'POST',
		body: JSON.stringify({ username_or_email, password }),
	});

	// store tokens + user
	try {
		localStorage.setItem('access', data.access);
		localStorage.setItem('refresh', data.refresh);
		localStorage.setItem('user', JSON.stringify(data.user));
	} catch (e) {}

	return data;
}

export async function refreshToken() {
	const refresh = localStorage.getItem('refresh');
	if (!refresh) throw new Error('No refresh token');
	const data = await apiFetch(`${ACCOUNTS_BASE}/refresh/`, {
		method: 'POST',
		body: JSON.stringify({ refresh }),
	});
	try { localStorage.setItem('access', data.access); } catch (e) {}
	return data;
}

export function logout() {
	try {
		localStorage.removeItem('access');
		localStorage.removeItem('refresh');
		localStorage.removeItem('user');
	} catch (e) {}
}

export function getStoredUser() {
	try {
		return JSON.parse(localStorage.getItem('user') || 'null');
	} catch (e) { return null; }
}

export default { login, refreshToken, logout, getStoredUser };
