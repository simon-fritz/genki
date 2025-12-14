const API_BASE = '/api';

async function handleResponse(res) {
	const contentType = res.headers.get('content-type') || '';
	const isJson = contentType.includes('application/json');
	const body = isJson ? await res.json() : await res.text();
	if (!res.ok) {
		const err = isJson ? body : { detail: body };
		const error = new Error(err.detail || 'Request failed');
		error.status = res.status;
		error.body = err;
		throw error;
	}
	return body;
}

export async function apiFetch(path, options = {}) {
	const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});

	// Attach access token if available
	try {
		const access = localStorage.getItem('access');
		if (access) headers['Authorization'] = `Bearer ${access}`;
	} catch (e) {}

	const res = await fetch(API_BASE + path, Object.assign({}, options, { headers }));
	return handleResponse(res);
}

export default apiFetch;
