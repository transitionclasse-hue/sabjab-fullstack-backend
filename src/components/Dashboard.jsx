import React, { useState, useEffect } from 'react';
import { Box, Text, Button, Loader, Icon } from '@adminjs/design-system';
import { styled } from '@adminjs/design-system/styled';
import { ApiClient } from 'adminjs';

const PremiumCard = styled(Box)`
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px -15px rgba(16, 185, 129, 0.15);
    border-color: #10b981;
  }
`;

const StatLabel = styled(Text)`
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const StatValue = styled(Text)`
  font-size: 44px;
  font-weight: 900;
  color: #1e293b;
  margin-top: 8px;
  line-height: 1;
`;

const ActionButton = styled(Box)`
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background: #f8fafc;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  width: 100%;
  text-decoration: none;
  color: inherit;
  &:hover {
    background: #ffffff;
    border-color: #10b981;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    transform: translateX(4px);
  }
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
            <Box p="xl" bg="#f8fafc" minHeight="100vh" display="flex" justifyContent="center" alignItems="center">
                <Loader color="#10b981" />
            </Box>
        );
    }

    return (
        <Box p="xxl" bg="#f8fafc" minHeight="100vh">
            {/* Header section with brand feel */}
            <Box mb="xxxl" display="flex" justifyContent="space-between" alignItems="flex-end">
                <Box>
                    <Text color="#0f172a" fontSize="40px" fontWeight="900" letterSpacing="-0.02em">Store Insights</Text>
                    <Text color="#64748b" mt="xs" fontSize="18px">Welcome back. Here's what's happening today at SabJab.</Text>
                </Box>
                <Box display={['none', 'block']}>
                   <Button variant="primary" as="a" href="/admin/resources/Product/actions/new">
                        <Icon icon="Plus" mr="sm" />
                        Quick Add Product
                   </Button>
                </Box>
            </Box>

            {/* Main Stats Grid */}
            <Box display="grid" gridTemplateColumns={["1fr", "1fr 1fr", "1fr 1fr 1fr 1fr"]} gridGap="32px" mb="xxxl">
                <PremiumCard>
                    <StatLabel>Live Success</StatLabel>
                    <StatValue>{stats.totalOrders}</StatValue>
                    <Box mt="md" display="flex" alignItems="center">
                        <Text color="#10b981" fontWeight="bold" variant="sm">Total Orders</Text>
                    </Box>
                </PremiumCard>

                <PremiumCard>
                    <StatLabel>Community</StatLabel>
                    <StatValue>{stats.activeCustomers}</StatValue>
                    <Box mt="md" display="flex" alignItems="center">
                        <Text color="#10b981" fontWeight="bold" variant="sm">Active Users</Text>
                    </Box>
                </PremiumCard>

                <PremiumCard borderLeft="4px solid #facc15">
                    <StatLabel>Ops Queue</StatLabel>
                    <StatValue color={stats.pendingOrders > 0 ? "#854d0e" : "#10b981"}>{stats.pendingOrders}</StatValue>
                    <Box mt="md" display="flex" alignItems="center">
                        <Text color="#854d0e" fontWeight="bold" variant="sm">Pending Orders</Text>
                    </Box>
                </PremiumCard>

                <PremiumCard borderLeft="4px solid #ef4444">
                    <StatLabel>Inventory Help</StatLabel>
                    <StatValue color={stats.lowStockAlerts > 0 ? "#991b1b" : "#10b981"}>{stats.lowStockAlerts}</StatValue>
                    <Box mt="md" display="flex" alignItems="center">
                        <Text color="#991b1b" fontWeight="bold" variant="sm">Stock Alerts</Text>
                    </Box>
                </PremiumCard>
            </Box>

            {/* Quick Actions & Maintenance */}
            <Box display="grid" gridTemplateColumns={["1fr", "1fr", "2fr 1fr"]} gridGap="40px">
                <Box>
                    <Text color="#0f172a" fontSize="24px" fontWeight="800" mb="xl">Quick Management Console</Text>
                    <Box display="grid" gridTemplateColumns={["1fr", "1fr 1fr"]} gridGap="16px">
                        <ActionButton as="a" href="/admin/resources/Order">
                            <Box bg="rgba(16, 185, 129, 0.1)" p="md" borderRadius="12px" mr="md">
                                <Icon icon="ShoppingCart" color="#10b981" />
                            </Box>
                            <Box>
                                <Text fontWeight="bold">Orders Console</Text>
                                <Text variant="sm" color="#64748b">Manage live delivery queue</Text>
                            </Box>
                        </ActionButton>
                        
                        <ActionButton as="a" href="/admin/resources/Product">
                            <Box bg="rgba(59, 130, 246, 0.1)" p="md" borderRadius="12px" mr="md">
                                <Icon icon="Package" color="#3b82f6" />
                            </Box>
                            <Box>
                                <Text fontWeight="bold">Catalog Manager</Text>
                                <Text variant="sm" color="#64748b">Update items and stock</Text>
                            </Box>
                        </ActionButton>

                        <ActionButton as="a" href="/admin/resources/Coupon">
                            <Box bg="rgba(244, 63, 94, 0.1)" p="md" borderRadius="12px" mr="md">
                                <Icon icon="Tag" color="#f43f5e" />
                            </Box>
                            <Box>
                                <Text fontWeight="bold">Marketing Hub</Text>
                                <Text variant="sm" color="#64748b">Coupons and deals</Text>
                            </Box>
                        </ActionButton>

                        <ActionButton as="a" href="/admin/resources/StoreStatus">
                            <Box bg="rgba(107, 114, 128, 0.1)" p="md" borderRadius="12px" mr="md">
                                <Icon icon="Settings" color="#6b7280" />
                            </Box>
                            <Box>
                                <Text fontWeight="bold">System Status</Text>
                                <Text variant="sm" color="#64748b">Store timings & config</Text>
                            </Box>
                        </ActionButton>
                    </Box>
                </Box>

                <Box>
                  <PremiumCard bg="#047857">
                    <Text color="white" fontSize="20px" fontWeight="900" mb="md">Need Assistance?</Text>
                    <Text color="rgba(255,255,255,0.8)" mb="xl" lineHeight="1.6">
                      If you're facing technical issues with the order flow or Cloudinary sync, check the documentation or contact support.
                    </Text>
                    <Button variant="secondary" as="a" href="/admin/pages/Component Guide" width="100%">
                        View System Guide
                    </Button>
                  </PremiumCard>
                </Box>
            </Box>
        </Box>
    );
};

export default Dashboard;
