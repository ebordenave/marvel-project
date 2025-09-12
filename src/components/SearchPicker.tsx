import { useMemo, useState } from "react";
import {
    Avatar,
    Combobox,
    Group,
    Highlight,
    Loader,
    TextInput,
    useCombobox,
} from "@mantine/core";
import { useCharacterSearch } from "../hooks/useCharacterSearch";

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
    const { results, loading, error, apiCallCount } = useCharacterSearch(value);

    function handlePickById(id: string) {
        const item = results.find((r) => String(r.id) === id);
        if (!item) return;
        setValue(item.name);
        combobox.closeDropdown();
        onPick?.(item);
    }

    const options = useMemo(() => {
        if (error) return <Combobox.Empty>{error}</Combobox.Empty>;
        if (loading && results.length === 0) {
            return <Combobox.Empty>Loading…</Combobox.Empty>;
        }
        if (!loading && results.length === 0) {
            return <Combobox.Empty>No results</Combobox.Empty>;
        }

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
        <div>
            <Combobox
                store={combobox}
                withinPortal={false}
                onOptionSubmit={handlePickById}
            >
                <Combobox.Target>
                    <TextInput
                        value={value}
                        onChange={(e) => {
                            setValue(e.currentTarget.value);
                            if (e.currentTarget.value) {
                                combobox.openDropdown();
                            } else {
                                combobox.closeDropdown();
                            }
                        }}
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
                <Combobox.Dropdown>
                    <Combobox.Options>{options}</Combobox.Options>
                </Combobox.Dropdown>
            </Combobox>

            {/*<div style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>*/}
            {/*    API calls made: {apiCallCount}*/}
            {/*</div>*/}
        </div>
    );
}