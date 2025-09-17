import { useCombobox, Combobox, TextInput, Loader, Highlight, Group, Avatar, Text } from "@mantine/core";
import { useCharacterSearch, Character } from "../hooks/useCharacterSearch";
import { useState, useEffect } from "react";

type Props = { onPick?: (c: Character) => void };

export default function SearchPicker({ onPick }: Props) {
    const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() });

    const [inputValue, setValue] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(inputValue);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [inputValue]);

    const { data: results, isFetching, isPlaceholderData, apiCallCount } = useCharacterSearch(debouncedQuery, 10);

    function handlePickById(id: string) {
        const item = results.find((r) => String(r.id) === id);
        if (!item) return;
        setValue(item.name);
        combobox.closeDropdown();
        onPick?.(item);
    }

    const options = results.map((item) => (
        <Combobox.Option key={item.id} value={String(item.id)}>
            <Group gap="sm">
                <Avatar size="sm" src={item.thumbnailUrl}>{item.name[0]}</Avatar>
                <Highlight highlight={inputValue}>{item.name}</Highlight>
            </Group>
        </Combobox.Option>
    ));

    return (
        <Combobox store={combobox} withinPortal={false} onOptionSubmit={handlePickById}>
            <Combobox.Target>
                <TextInput
                    value={inputValue}
                    onChange={(e) => setValue(e.currentTarget.value)}
                    onFocus={() => combobox.openDropdown()}
                    placeholder="Search Marvel characters…"
                    rightSection={isFetching ? <Loader size="sm" /> : null}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && results[0]) {
                            handlePickById(String(results[0].id));
                        }
                    }}
                />
            </Combobox.Target>
            <Text size="xs" c="dimmed" ta="right" mt={4}>
                API Calls: {apiCallCount}
            </Text>
            <Combobox.Dropdown>
                <Combobox.Options
                    style={{ opacity: isPlaceholderData ? 0.6 : 1 }}
                >
                    {options}
                    {isFetching && options.length === 0 && <Combobox.Empty>Loading…</Combobox.Empty>}
                    {!isFetching && options.length === 0 && inputValue.length > 1 && (
                        <Combobox.Empty>No results found</Combobox.Empty>
                    )}
                </Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
    );
}