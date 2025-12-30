import api from "@/api/client";

export interface BacksideRequestRapidMode {
    front: string;
}

export interface BacksideRequestAccuracyMode {
    front: string;
    deck_id: string;
}

export interface RevisionRequestRapidMode {
    front: string;
    previous_backside: string;
    feedback: string;
}

export interface RevisionRequestAccuracyMode {
    front: string;
    deck_id: string;
    previous_backside: string;
    feedback: string;
}

export interface BacksideResponse {
    front: string;
    back: string;
}

/* Get backside in rapid mode
 */
export async function getBacksideRapidMode(
    request: BacksideRequestRapidMode,
): Promise<BacksideResponse> {
    const response = await api.post<BacksideResponse>(
        "/agent/flashcard/rapid/backside/",
        request,
    );
    return response.data;
}

/* Get backside in accuracy mode
 */
export async function getBacksideAccuracyMode(
    request: BacksideRequestAccuracyMode,
): Promise<BacksideResponse> {
    const response = await api.post<BacksideResponse>(
        "/agent/flashcard/backside/",
        request,
    );
    return response.data;
}

export async function getRevisedBacksideRapidMode(
    revisionRequest: RevisionRequestRapidMode,
): Promise<BacksideResponse> {
    const response = await api.post<BacksideResponse>(
        "/agent/flashcard/rapid/backside/revise/",
        revisionRequest,
    );
    return response.data;
}

export async function getRevisedBacksideAccuracyMode(
    revisionRequest: RevisionRequestAccuracyMode,
): Promise<BacksideResponse> {
    const response = await api.post<BacksideResponse>(
        "/agent/flashcard/backside/revise/",
        revisionRequest,
    );
    return response.data;
}
