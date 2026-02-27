import React from 'react';
import { Box, Text, Button } from '@adminjs/design-system';
import { styled } from '@adminjs/design-system/styled';

const GlassCard = styled(Box)`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.08);
    border-color: #22c55e;
  }
`;

const StatValue = styled(Text)`
  font-size: 32px;
  font-weight: 800;
  color: #22c55e;
  margin-top: 4px;
`;

const Dashboard = () => {
    return (
        <Box p="xl" bg="#050505" minHeight="100vh">
            {/* Welcome Header */}
            <Box mb="xxl">
                <Text color="white" fontSize="32px" fontWeight="900">Welcome to SabJab Premium</Text>
                <Text color="rgba(255,255,255,0.6)" mt="sm">Your store snapshot and performance metrics.</Text>
            </Box>

            {/* Quick Stats Grid */}
            <Box display="grid" gridTemplateColumns={["1fr", "1fr 1fr", "1fr 1fr 1fr 1fr"]} gridGap="24px">
                <GlassCard>
                    <Text color="rgba(255,255,255,0.7)" textTransform="uppercase" fontWeight="700">Total Orders</Text>
                    <StatValue>1,284</StatValue>
                    <Text color="#22c55e" variant="sm" mt="sm">↑ 12% from last week</Text>
                </GlassCard>

                <GlassCard>
                    <Text color="rgba(255,255,255,0.7)" textTransform="uppercase" fontWeight="700">Active Customers</Text>
                    <StatValue>4,821</StatValue>
                    <Text color="#22c55e" variant="sm" mt="sm">Live right now</Text>
                </GlassCard>

                <GlassCard>
                    <Text color="rgba(255,255,255,0.7)" textTransform="uppercase" fontWeight="700">Total Revenue</Text>
                    <StatValue>₹82,490</StatValue>
                    <Text color="#22c55e" variant="sm" mt="sm">↑ 8% growth</Text>
                </GlassCard>

                <GlassCard>
                    <Text color="rgba(255,255,255,0.7)" textTransform="uppercase" fontWeight="700">Stock Alerts</Text>
                    <StatValue>12</StatValue>
                    <Text color="#ef4444" variant="sm" mt="sm">Items low on stock</Text>
                </GlassCard>
            </Box>

            {/* Shortcuts Section */}
            <Box mt="xxl">
                <GlassCard bg="linear-gradient(90deg, rgba(34,197,94,0.1), transparent)">
                    <Box>
                        <Text color="white" fontSize="24px" fontWeight="bold" mb="sm">Management Console</Text>
                        <Text color="rgba(255,255,255,0.8)" mb="md">
                            Monitor deliveries, manage inventory, and update store configuration.
                            All your essential tools are available in the navigation sidebar.
                        </Text>
                        <Button variant="primary" as="a" href="/admin/resources/Order">
                            View All Orders
                        </Button>
                    </Box>
                </GlassCard>
            </Box>
        </Box>
    );
};

export default Dashboard;
