// src/components/SearchPicker.tsx
import { Text } from "@mantine/core";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Combobox,
    useCombobox,
    TextInput,
    Loader,
    Highlight,
    Group,
    Avatar,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";

export type Character = {
    id: number;
    name: string;
    thumbnailUrl?: string;
};

type Props = { onPick?: (c: Character) => void };

export default function SearchPicker({ onPick }: Props) {
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
    });

    const [value, setValue] = useState("");
    const [debounced] = useDebouncedValue(value, 250);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Character[]>([]);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const [apiCallCount, setApiCallCount] = useState(0);



    useEffect(() => {
        setError(null);

        if (debounced.trim().length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }

        // cancel any in-flight request
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
            .then((data) => {
                setResults(data);
                combobox.openDropdown();
            })
            .catch((e: any) => {
                if (e?.name !== "AbortError") setError("Could not load results");
            })
            .finally(() => setLoading(false));

        return () => ctl.abort();
    }, [debounced]);

    function handlePickById(id: string) {
        const item = results.find((r) => String(r.id) === id);
        if (!item) return;
        setValue(item.name);
        combobox.closeDropdown();
        onPick?.(item);
    }

    const options = useMemo(() => {
        if (error) return <Combobox.Empty>{error}</Combobox.Empty>;
        if (loading && results.length === 0)
            return <Combobox.Empty>Loading…</Combobox.Empty>;
        if (!loading && results.length === 0)
            return <Combobox.Empty>No results</Combobox.Empty>;

        return results.map((item) => (
            <Combobox.Option key={item.id} value={String(item.id)}>
                <Group gap="sm">
                    <Avatar size="sm" src={item.thumbnailUrl}>
                        {item.name[0]}
                    </Avatar>
                    <Highlight highlight={value}>{item.name}</Highlight>
                </Group>
            </Combobox.Option>
        ));
    }, [results, loading, error, value]);

    return (
        <Combobox
            store={combobox}
            withinPortal={false}
            onOptionSubmit={handlePickById}
        >
            <Combobox.Target>
                <TextInput
                    value={value}
                    onChange={(e) => setValue(e.currentTarget.value)}
                    onFocus={() => combobox.openDropdown()}
                    placeholder="Search Marvel characters…"
                    rightSection={loading ? <Loader size="sm" /> : null}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && results[0]) {
                            handlePickById(String(results[0].id)); // choose top result
                        }
                    }}
                />
            </Combobox.Target>
            API calls made: {apiCallCount}

            <Combobox.Dropdown>
                <Combobox.Options>{options}</Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
    );
}