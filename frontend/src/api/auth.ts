import api, { setTokens } from "./client";

export interface RegisterParams {
    username: string;
    email: string;
    password: string;
    password2: string;
}

export interface RegisterResponse {
    id: number;
    username: string;
    email: string;
}

export interface LoginParams {
    username_or_email: string;
    password: string;
}

export interface LoginResponse {
    access: string;
    refresh: string;
    user: {
        id: number;
        username: string;
        email: string;
    };
}

export async function login({
    username_or_email,
    password,
}: LoginParams): Promise<LoginResponse> {
    try {
        const { data } = await api.post<LoginResponse>("/auth/login/", {
            username_or_email,
            password,
        });
        // Store tokens and user info
        setTokens(data.access, data.refresh);
        localStorage.setItem("user", JSON.stringify(data.user));
        return data;
    } catch (error: unknown) {
        if (
            error instanceof Error &&
            "response" in error &&
            (error as { response?: { status?: number } }).response?.status ===
                401
        ) {
            throw new Error("Invalid credentials.");
        }
        throw error;
    }
}

export async function register({
    username,
    email,
    password,
    password2,
}: RegisterParams): Promise<RegisterResponse> {
    try {
        const { data } = await api.post<RegisterResponse>("/auth/register/", {
            username,
            email,
            password,
            password2,
        });
        return data;
    } catch (error: unknown) {
        // If the response is a 400 with no content, throw a specific error
        if (error instanceof Error && "response" in error) {
            const axiosError = error as {
                response?: { status?: number; data?: unknown };
            };
            if (
                axiosError.response?.status === 400 &&
                !axiosError.response?.data
            ) {
                throw new Error(
                    "Registration failed: Invalid input or user already exists.",
                );
            }
        }
        // Otherwise, rethrow the error
        throw error;
    }
}
