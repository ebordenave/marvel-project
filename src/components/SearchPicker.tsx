// src/components/SearchPicker.tsx
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

type Props = {
    onPick?: (c: Character) => void;
};

export default function SearchPicker({ onPick }: Props) {
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
    });

    const [value, setValue] = useState<string>("");
    const [debounced] = useDebouncedValue(value, 250);
    const [loading, setLoading] = useState<boolean>(false);
    const [results, setResults] = useState<Character[]>([]);
    const [error, setError] = useState<string | null>(null);

    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        setError(null);

        if (debounced.trim().length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }

        // cancel previous
        abortRef.current?.abort();
        const ctl = new AbortController();
        abortRef.current = ctl;

        setLoading(true);
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
            .catch((e: unknown) => {
                if ((e as { name?: string })?.name !== "AbortError") {
                    setError("Could not load results");
                }
            })
            .finally(() => setLoading(false));

        return () => ctl.abort();
    }, [debounced, combobox]);

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
                            handlePickById(String(results[0].id));
                        }
                    }}
                />
            </Combobox.Target>

            <Combobox.Dropdown>
                <Combobox.Options>{options}</Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
    );
}