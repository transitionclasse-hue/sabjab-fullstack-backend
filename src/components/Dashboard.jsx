import React, { useState, useEffect } from 'react';
import { Box, Text, Button, Loader } from '@adminjs/design-system';
import { styled } from '@adminjs/design-system/styled';
import { ApiClient } from 'adminjs';

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
    const [stats, setStats] = useState({
        totalOrders: 0,
        activeCustomers: 0,
        lowStockAlerts: 0,
        pendingOrders: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const api = new ApiClient();
                // We fetch counts using AdminJS API directly
                const [ordersRes, pendingOrdersRes, customersRes, lowStockRes] = await Promise.all([
                    api.resourceAction({ resourceId: 'Order', actionName: 'list', params: { perPage: 1 } }),
                    api.resourceAction({ resourceId: 'Order', actionName: 'list', params: { 'filters.status': 'available', perPage: 1 } }),
                    api.resourceAction({ resourceId: 'Customer', actionName: 'list', params: { perPage: 1 } }),
                    api.resourceAction({ resourceId: 'Product', actionName: 'list', params: { 'filters.stock~~lte': 10, perPage: 1 } })
                ]);

                setStats({
                    totalOrders: ordersRes?.data?.meta?.total || 0,
                    pendingOrders: pendingOrdersRes?.data?.meta?.total || 0,
                    activeCustomers: customersRes?.data?.meta?.total || 0,
                    lowStockAlerts: lowStockRes?.data?.meta?.total || 0
                });
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (loading) {
        return (
            <Box p="xl" bg="#050505" minHeight="100vh" display="flex" justifyContent="center" alignItems="center">
                <Loader />
            </Box>
        );
    }

    return (
        <Box p="xl" bg="#050505" minHeight="100vh">
            {/* Welcome Header */}
            <Box mb="xxl">
                <Text color="white" fontSize="32px" fontWeight="900">Welcome to SabJab Admin Panel</Text>
                <Text color="rgba(255,255,255,0.6)" mt="sm">Your store snapshot and live metrics.</Text>
            </Box>

            {/* Quick Stats Grid */}
            <Box display="grid" gridTemplateColumns={["1fr", "1fr 1fr", "1fr 1fr 1fr 1fr"]} gridGap="24px">
                <GlassCard>
                    <Text color="rgba(255,255,255,0.7)" textTransform="uppercase" fontWeight="700">Total Orders</Text>
                    <StatValue>{stats.totalOrders}</StatValue>
                    <Text color="rgba(255,255,255,0.5)" variant="sm" mt="sm">All time</Text>
                </GlassCard>

                <GlassCard>
                    <Text color="rgba(255,255,255,0.7)" textTransform="uppercase" fontWeight="700">Registered Customers</Text>
                    <StatValue>{stats.activeCustomers}</StatValue>
                    <Text color="rgba(255,255,255,0.5)" variant="sm" mt="sm">All time</Text>
                </GlassCard>

                <GlassCard>
                    <Text color="rgba(255,255,255,0.7)" textTransform="uppercase" fontWeight="700">Pending Orders</Text>
                    <StatValue color={stats.pendingOrders > 0 ? "#facc15" : "#22c55e"}>{stats.pendingOrders}</StatValue>
                    <Text color="rgba(255,255,255,0.5)" variant="sm" mt="sm">Needs assignment</Text>
                </GlassCard>

                <GlassCard>
                    <Text color="rgba(255,255,255,0.7)" textTransform="uppercase" fontWeight="700">Stock Alerts</Text>
                    <StatValue color={stats.lowStockAlerts > 0 ? "#ef4444" : "#22c55e"}>{stats.lowStockAlerts}</StatValue>
                    <Text color="rgba(255,255,255,0.5)" variant="sm" mt="sm">Items running low (≤10)</Text>
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
