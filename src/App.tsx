import { Container, Title, Stack, Text } from "@mantine/core";
import { useState } from "react";
import SearchPicker, { Character } from "./components/SearchPicker";
import CharacterDetails from "./components/CharacterDetails";

export default function App() {
    const [picked, setPicked] = useState<Character | null>(null);

    return (
        <Container py="xl">
            <Stack gap="md" align="stretch">
                <Title order={2}>Marvel Search (TSX)</Title>
                <SearchPicker onPick={setPicked} />
                {picked && (
                    <>
                        <Text>
                            You selected: <strong>{picked.name}</strong>
                        </Text>
                        <CharacterDetails id={picked.id} />
                    </>
                )}
            </Stack>
        </Container>
    );
}