// src/hooks/useCharacterSearch.ts
import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";

export type Character = {
    id: number;
    name: string;
    thumbnailUrl?: string;
};

type UseCharacterSearchOpts = {
    minChars?: number;
    debounceMs?: number;
    limit?: number;
};

export function useCharacterSearch(query: string, opts?: UseCharacterSearchOpts) {
    const { minChars = 3, debounceMs = 450, limit = 10 } = opts ?? {};
    const [debounced] = useDebouncedValue(query, debounceMs);
    const [results, setResults] = useState<Character[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [apiCallCount, setApiCallCount] = useState(0);

    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const q = debounced.trim();

        // clear when below min chars
        if (q.length < minChars) {
            abortRef.current?.abort();
            setResults([]);
            setLoading(false);
            setError(null);
            return;
        }

        // cancel previous
        abortRef.current?.abort();
        const ctl = new AbortController();
        abortRef.current = ctl;

        setLoading(true);
        setError(null);
        setApiCallCount((c) => c + 1);

        fetch(`/api/marvel/characters?query=${encodeURIComponent(q)}&limit=${limit}`, {
            signal: ctl.signal,
        })
            .then(async (r) => {
                if (!r.ok) {
                    // bubble useful messages
                    if (r.status === 429) throw new Error("Rate limited. Try again later.");
                    if (r.status === 403) throw new Error("Forbidden (check API referrers).");
                    throw new Error(`HTTP ${r.status}`);
                }
                return (await r.json()) as Character[];
            })
            .then((data) => {
                setResults(Array.isArray(data) ? data : []);
            })
            .catch((e: any) => {
                if ((e as { name?: string })?.name !== "AbortError") {
                    setError(String(e?.message ?? "Could not load results"));
                }
            })
            .finally(() => setLoading(false));

        return () => ctl.abort();
    }, [debounced, minChars, limit]);

    return { results, loading, error, apiCallCount };
}