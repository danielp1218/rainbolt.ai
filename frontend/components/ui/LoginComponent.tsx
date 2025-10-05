"use client";

import { Avatar, Box, Flex, Text, DropdownMenu, Button } from "@radix-ui/themes";
import { useAuth0Firebase } from "@/hooks/useAuth0Firebase";

export default function LoginComponent() {
    const { user, firebaseUserId, isLoading } = useAuth0Firebase();

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
                        <Text as="div" size="2" weight="bold" className="text-white">
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
                                <Text as="div" size="2" weight="bold" className="text-white">
                                    {user?.name ? user.name.substring(0, 10) : "Guest"}
                                </Text>
                                <Text as="div" size="2" className="text-white/70">
                                    {user?.email || "Click to login"}
                                </Text>
                            </Box>
                        </Flex>
                    </Box>
                </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="min-w-[200px]">
                {user ? (
                    <DropdownMenu.Item asChild>
                        <a href="/auth/logout" className="cursor-pointer text-red-500">
                            Log Out
                        </a>
                    </DropdownMenu.Item>
                ) : (
                    <DropdownMenu.Item asChild>
                        <a href="/auth/login" className="cursor-pointer">
                            Log In
                        </a>
                    </DropdownMenu.Item>
                )}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}