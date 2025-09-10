import { Card, Group, Image, Stack, Text, Title, Loader } from "@mantine/core";
import { useEffect, useState } from "react";

type CharacterDetailsData = {
    id: number;
    name: string;
    description: string;
    thumbnailUrl?: string;
    comicsAvailable: number;
    seriesAvailable: number;
    storiesAvailable: number;
};

export default function CharacterDetails({ id }: { id: number }) {
    const [data, setData] = useState<CharacterDetailsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;
        setLoading(true);
        setError(null);
        setData(null);

        fetch(`/api/marvel/characters/${id}`)
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return (await r.json()) as CharacterDetailsData;
            })
            .then((d) => {
                if (!ignore) setData(d);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));

        return () => {
            ignore = true;
        };
    }, [id]);

    if (loading) return <Loader />;
    if (error) return <Text c="red">Error: {error}</Text>;
    if (!data) return null;

    return (
        <Card withBorder radius="lg" p="lg">
            <Group align="flex-start" wrap="nowrap">
                {data.thumbnailUrl ? (
                    <Image src={data.thumbnailUrl} alt={data.name} w={140} radius="md" />
                ) : null}
                <Stack gap="xs">
                    <Title order={3}>{data.name}</Title>
                    <Text size="sm" c="dimmed">
                        {data.description}
                    </Text>
                    <Group gap="md">
                        <Text size="sm">Comics: <b>{data.comicsAvailable}</b></Text>
                        <Text size="sm">Series: <b>{data.seriesAvailable}</b></Text>
                        <Text size="sm">Stories: <b>{data.storiesAvailable}</b></Text>
                    </Group>
                </Stack>
            </Group>
        </Card>
    );
}