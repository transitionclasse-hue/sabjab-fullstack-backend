import React from 'react';
import { Box, H2, H5, Text, Illustration, Button, Icon } from '@adminjs/design-system';
import { styled } from '@adminjs/design-system/styled';

const GlassCard = styled(Box)`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 32px;
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.08);
    border-color: #00F5FF;
  }
`;

const StatValue = styled(Text)`
  font-size: 42px;
  font-weight: 900;
  color: #00F5FF;
  margin-top: 8px;
`;

const Dashboard = () => {
    return (
        <Box p="xl" bg="#050505" minHeight="100vh">
            {/* Welcome Header */}
            <Box mb="xxl" display="flex" flexDirection="row" alignItems="center" justifyContent="space-between">
                <Box>
                    <H2 color="white" fontWeight="900">Welcome to SabJab Premium</H2>
                    <Text color="rgba(255,255,255,0.6)" mt="sm">Your store is currently performing excellently. Here's your snapshot.</Text>
                </Box>
                <Button variant="primary" size="lg">
                    <Icon icon="Plus" />
                    Add New Product
                </Button>
            </Box>

            {/* Quick Stats Grid */}
            <Box display="grid" gridTemplateColumns={["1fr", "1fr 1fr", "1fr 1fr 1fr 1fr"]} gridGap="24px">
                <GlassCard>
                    <H5 color="rgba(255,255,255,0.7)" textTransform="uppercase" letterSpacing="1px">Total Orders</H5>
                    <StatValue>1,284</StatValue>
                    <Text color="#22c55e" size="sm" mt="sm">↑ 12% from last week</Text>
                </GlassCard>

                <GlassCard>
                    <H5 color="rgba(255,255,255,0.7)" textTransform="uppercase" letterSpacing="1px">Active Customers</H5>
                    <StatValue>4,821</StatValue>
                    <Text color="#00F5FF" size="sm" mt="sm">Live right now</Text>
                </GlassCard>

                <GlassCard>
                    <H5 color="rgba(255,255,255,0.7)" textTransform="uppercase" letterSpacing="1px">Total Revenue</H5>
                    <StatValue>₹82,490</StatValue>
                    <Text color="#22c55e" size="sm" mt="sm">↑ 8% growth</Text>
                </GlassCard>

                <GlassCard>
                    <H5 color="rgba(255,255,255,0.7)" textTransform="uppercase" letterSpacing="1px">Stock Alerts</H5>
                    <StatValue>12</StatValue>
                    <Text color="#FF2E63" size="sm" mt="sm">Items low on stock</Text>
                </GlassCard>
            </Box>

            {/* Shortcuts / Promotion Section */}
            <Box mt="xxl">
                <GlassCard display="flex" flexDirection="row" alignItems="center" bg="linear-gradient(90deg, rgba(0,245,255,0.1), transparent)">
                    <Box flex={1}>
                        <H2 color="white" mb="sm">Home Builder V2 is Live! 🧱</H2>
                        <Text color="rgba(255,255,255,0.8)" mb="md">
                            You can now use premium Bento Grids, Story Strips, and Gradient Heroes to build your store.
                            Customize your brand experience with unique themes for every occasion.
                        </Text>
                        <Button variant="light" as="a" href="/admin/resources/HomeComponent">
                            Build My Home Screen
                        </Button>
                    </Box>
                    <Illustration name="Folder" width="120px" />
                </GlassCard>
            </Box>
        </Box>
    );
};

export default Dashboard;
