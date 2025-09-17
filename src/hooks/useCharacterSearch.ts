import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";

export type Character = {
    id: number;
    name: string;
    thumbnailUrl?: string;
};

export function useCharacterSearch(query: string, limit: number = 10) {
    const shouldEnable = query.trim().length >= 2;
    const [apiCallCount, setApiCallCount] = useState(0);

    const { data = [], isFetching, isPlaceholderData } = useQuery<Character[]>({
        queryKey: ["characters", query, limit],
        queryFn: async (): Promise<Character[]> => {
            setApiCallCount((prev) => prev + 1);

            const res = await fetch(
                `/api/marvel/characters?query=${encodeURIComponent(query)}&limit=${limit}`
            );
            if (!res.ok) throw new Error("Failed to fetch characters");
            return (await res.json()) as Character[];
        },
        enabled: shouldEnable,
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });

    return { data, isFetching, isPlaceholderData, apiCallCount };
}