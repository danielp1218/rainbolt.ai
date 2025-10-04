"use client";

import { Avatar, Box, Flex, Text, DropdownMenu, Button } from "@radix-ui/themes";
import { useUser } from "@auth0/nextjs-auth0";

export default function LoginComponent() {
    const { user, isLoading } = useUser();

    if (isLoading) {
        return (
            <Box maxWidth="240px" className="border-gray p-2 border-2 rounded-xl">
                <Flex gap="3" align="center">
                    <Avatar
                        size="3"
                        src=""
                        radius="full"
                        fallback="..."
                    />
                    <Box>
                        <Text as="div" size="2" weight="bold">
                            Loading...
                        </Text>
                    </Box>
                </Flex>
            </Box>
        );
    }

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <Button variant="ghost" className="cursor-pointer">
                    <Box maxWidth="240px" className="border-gray p-2 border-2 rounded-xl hover:bg-white/5 transition-colors">
                        <Flex gap="3" align="center">
                            <Avatar
                                size="3"
                                src={user?.picture || ""}
                                radius="full"
                                fallback={user?.name?.[0]?.toUpperCase() || "G"}
                            />
                            <Box>
                                <Text as="div" size="2" weight="bold">
                                    {user?.name ? user.name.substring(0, 10) : "Guest"}
                                </Text>
                                <Text as="div" size="2" color="gray">
                                    {user?.email || "Click to login"}
                                </Text>
                            </Box>
                        </Flex>
                    </Box>
                </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="min-w-[200px]">

                <DropdownMenu.Item asChild>
                    <a href="/auth/login" className="cursor-pointer">
                        Log In
                    </a>
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item asChild>
                    <a href="/auth/logout" className="cursor-pointer text-red-500">
                        Log Out
                    </a>
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}