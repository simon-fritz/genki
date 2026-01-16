import api from "./client";

// Preference types matching the backend schema
export type Verbosity = "concise" | "balanced" | "detailed";
export type Structure = "sections" | "bullets" | "paragraph";
export type AnalogyDomain = "coding" | "everyday" | "math";
export type Difficulty = "auto" | "beginner" | "intermediate" | "advanced";
export type Language = "en" | "fr" | "de" | "es" | "ar";

export interface Preferences {
    verbosity: Verbosity;
    structure: Structure;
    include_examples: boolean;
    examples_per_answer: number;
    include_analogies: boolean;
    analogy_domain: AnalogyDomain;
    step_by_step: boolean;
    socratic_mode: boolean;
    include_mnemonic: boolean;
    quiz_at_end: boolean;
    language: Language;
    difficulty: Difficulty;
    auto_tune: boolean;
}

export interface Weights {
    examples: number;
    analogies: number;
    step_by_step: number;
    mnemonic: number;
    quiz: number;
    visual: number;
    concise: number;
}

export interface UserPreferencesResponse {
    preferences: Preferences;
    weights: Weights;
    generations: number;
    reviews: number;
    updated_at: string;
}

export interface PreferencesUpdatePayload {
    preferences?: Partial<Preferences>;
    weights?: Partial<Weights>;
}

/**
 * Get current user preferences and weights
 * GET /api/auth/preferences/
 */
export async function getPreferences(): Promise<UserPreferencesResponse> {
    const { data } =
        await api.get<UserPreferencesResponse>("/auth/preferences/");
    return data;
}

/**
 * Update user preferences and/or weights (partial update)
 * PATCH /api/auth/preferences/
 */
export async function updatePreferences(
    payload: PreferencesUpdatePayload,
): Promise<UserPreferencesResponse> {
    const { data } = await api.patch<UserPreferencesResponse>(
        "/auth/preferences/",
        payload,
    );
    return data;
}
