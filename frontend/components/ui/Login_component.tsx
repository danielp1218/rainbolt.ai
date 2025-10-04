"use client";

import { Card, Avatar, Box, Flex, Text } from "@radix-ui/themes";

export default function LoginComponent() {
    return (
        <Box maxWidth="240px">
            <Card>
                <Flex gap="3" align="center">
                    <Avatar
                        size="3"
                        src=""
                        radius="full"
                        fallback="U"
                    />
                    <Box>
                        <Text as="div" size="2" weight="bold">
                            Justin Wang
                        </Text>
                        <Text as="div" size="2" color="gray">
                            Engineering
                        </Text>
                    </Box>
                </Flex>
            </Card>
        </Box>
    );
}
