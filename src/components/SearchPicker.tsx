// src/components/SearchPicker.tsx
import { useMemo, useState } from "react";
import {
    Combobox,
    useCombobox,
    TextInput,
    Loader,
    Highlight,
    Group,
    Avatar,
} from "@mantine/core";
import { useCharacterSearch, Character } from "../hooks/useCharacterSearch";

type Props = { onPick?: (c: Character) => void };

export default function SearchPicker({ onPick }: Props) {
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
    });

    const [value, setValue] = useState("");
    // use hook: min 3 chars, 450ms debounce, limit 10
    const { results, loading, error, apiCallCount } = useCharacterSearch(value, {
        minChars: 3,
        debounceMs: 450,
        limit: 10,
    });

    // open dropdown when results appear
    if (!loading && results.length > 0) {
        // safe to call on render; combobox.openDropdown is noop if already open
        combobox.openDropdown();
    }

    function handlePickById(id: string) {
        const item = results.find((r) => String(r.id) === id);
        if (!item) return;
        setValue(item.name);
        combobox.closeDropdown();
        onPick?.(item);
    }

    const options = useMemo(() => {
        if (error) return <Combobox.Empty>{error}</Combobox.Empty>;
        if (loading && results.length === 0) return <Combobox.Empty>Loading…</Combobox.Empty>;
        if (!loading && results.length === 0) return <Combobox.Empty>No results</Combobox.Empty>;

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
        <Combobox store={combobox} withinPortal={false} onOptionSubmit={handlePickById}>
            <Combobox.Target>
                <TextInput
                    value={value}
                    onChange={(e) => setValue(e.currentTarget.value)}
                    onFocus={() => (results.length ? combobox.openDropdown() : undefined)}
                    placeholder="Search Marvel characters…"
                    autoComplete="off"
                    rightSection={loading ? <Loader size="sm" /> : null}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && results[0]) {
                            handlePickById(String(results[0].id)); // choose top result on Enter
                        }
                    }}
                />
            </Combobox.Target>

            {/* Debugging: API calls made (optional) */}
            {/* Remove or hide in production */}
            <div style={{ fontSize: 12, color: "#666", padding: "6px 8px" }}>
                API calls: {apiCallCount}
            </div>

            <Combobox.Dropdown>
                <Combobox.Options>{options}</Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
    );
}