import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import type { Character } from "../components/SearchPicker";

export function useCharacterSearch(query: string) {
    const [debounced] = useDebouncedValue(query, 250);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Character[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [apiCallCount, setApiCallCount] = useState(0);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        setError(null);

        if (debounced.trim().length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }

        abortRef.current?.abort();
        const ctl = new AbortController();
        abortRef.current = ctl;

        setLoading(true);
        setApiCallCount((count) => count + 1);

        fetch(`/api/marvel/characters?query=${encodeURIComponent(debounced)}`, {
            signal: ctl.signal,
        })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return (await r.json()) as Character[];
            })
            .then(setResults)
            .catch((e: any) => {
                if (e?.name !== "AbortError") setError("Could not load results");
            })
            .finally(() => setLoading(false));

        return () => ctl.abort();
    }, [debounced]);

    return { results, loading, error, apiCallCount };
}