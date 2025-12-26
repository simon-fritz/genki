import { useState, useCallback } from 'react';
import * as authApi from '../authApi';

export default function useAuth() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const login = useCallback(async ({ username_or_email, password }) => {
		setLoading(true);
		setError(null);
		try {
			const data = await authApi.login({ username_or_email, password });
			setLoading(false);
			return data;
		} catch (err) {
			setLoading(false);
			setError(err.body || { detail: err.message });
			throw err;
		}
	}, []);

	const logout = useCallback(() => {
		authApi.logout();
	}, []);

	const getUser = useCallback(() => authApi.getStoredUser(), []);

	return { login, logout, getUser, loading, error };
}
