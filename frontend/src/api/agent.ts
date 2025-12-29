import api from "@/api/client";

export interface FrontsideContents {
    front: string;
}

export interface RevisionRequest {
    front: string;
    previous_backside: string;
    feedback: string;
}

export interface BacksideResponse {
    front: string;
    back: string;
}

export async function getBacksideRapid(
    frontside: FrontsideContents,
): Promise<BacksideResponse> {
    const response = await api.post<BacksideResponse>(
        "/agent/flashcard/rapid/backside/",
        frontside,
    );
    return response.data;
}

export async function getRevisedBacksideRapid(
    revisionRequest: RevisionRequest,
): Promise<BacksideResponse> {
    const response = await api.post<BacksideResponse>(
        "/agent/flashcard/rapid/backside/revise/",
        revisionRequest,
    );
    return response.data;
}
