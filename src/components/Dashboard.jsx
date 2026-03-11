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
        pendingOrders: 0,
        totalRevenue: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const api = new ApiClient();
                // We use the configured resource IDs. 
                // Note: 'Order' might be registered multiple times, but AdminJS usually keeps the last one or the one with specific ID.
                // In our setup, 'Order' is the primary one, and 'OrderAssignment' is the secondary.
                
                const [ordersRes, pendingOrdersRes, customersRes, lowStockRes, deliveredOrdersRes, recentOrdersRes] = await Promise.all([
                    api.resourceAction({ resourceId: 'Order', actionName: 'list', params: { perPage: 1 } }),
                    api.resourceAction({ resourceId: 'Order', actionName: 'list', params: { 'filters.status': 'available', perPage: 1 } }),
                    api.resourceAction({ resourceId: 'Customer', actionName: 'list', params: { perPage: 1 } }),
                    api.resourceAction({ resourceId: 'Product', actionName: 'list', params: { 'filters.stock~~lte': 10, perPage: 1 } }),
                    api.resourceAction({ resourceId: 'Order', actionName: 'list', params: { 'filters.status': 'delivered', perPage: 100, sortBy: 'createdAt', direction: 'desc' } }),
                    api.resourceAction({ resourceId: 'Order', actionName: 'list', params: { perPage: 5, sortBy: 'createdAt', direction: 'desc' } })
                ]);

                // Helper to extract total from AdminJS response structure
                const getTotal = (res) => {
                    if (res?.data?.meta?.total !== undefined) return res.data.meta.total;
                    if (res?.meta?.total !== undefined) return res.meta.total;
                    return 0;
                };

                const getRecords = (res) => {
                    if (res?.data?.records) return res.data.records;
                    if (res?.records) return res.records;
                    return [];
                };

                // Calculate revenue from delivered orders
                const deliveredRecords = getRecords(deliveredOrdersRes);
                let totalRevenue = 0;
                deliveredRecords.forEach(order => {
                    const price = parseFloat(order.params?.totalPrice || 0);
                    if (!isNaN(price)) totalRevenue += price;
                });

                setStats({
                    totalOrders: getTotal(ordersRes),
                    pendingOrders: getTotal(pendingOrdersRes),
                    activeCustomers: getTotal(customersRes),
                    lowStockAlerts: getTotal(lowStockRes),
                    totalRevenue: Math.round(totalRevenue)
                });

                setRecentOrders(getRecords(recentOrdersRes));

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
                    <Text color="#64748b" mt="xs" fontSize="18px">Real-time performance from your SabJab database.</Text>
                </Box>
                <Box display={['none', 'block']}>
                   <Button variant="primary" as="a" href="/admin/resources/Product/actions/new">
                        <Icon icon="Plus" mr="sm" />
                        Add New Item
                   </Button>
                </Box>
            </Box>

            {/* Main Stats Grid */}
            <Box display="grid" gridTemplateColumns={["1fr", "1fr 1fr", "1fr 1fr 1fr", "1fr 1fr 1fr 1fr 1fr"]} gridGap="32px" mb="xxxl">
                <PremiumCard>
                    <StatLabel>Growth Metrics</StatLabel>
                    <StatValue>{stats.totalOrders}</StatValue>
                    <Box mt="md" display="flex" alignItems="center">
                        <Text color="#10b981" fontWeight="bold" variant="sm">Total Orders Placed</Text>
                    </Box>
                </PremiumCard>

                <PremiumCard>
                    <StatLabel>Customer Base</StatLabel>
                    <StatValue>{stats.activeCustomers}</StatValue>
                    <Box mt="md" display="flex" alignItems="center">
                        <Text color="#3b82f6" fontWeight="bold" variant="sm">Registered Users</Text>
                    </Box>
                </PremiumCard>

                <PremiumCard borderLeft="4px solid #facc15">
                    <StatLabel>Pending Ops</StatLabel>
                    <StatValue color={stats.pendingOrders > 0 ? "#854d0e" : "#10b981"}>{stats.pendingOrders}</StatValue>
                    <Box mt="md" display="flex" alignItems="center">
                        <Text color="#854d0e" fontWeight="bold" variant="sm">Unassigned Orders</Text>
                    </Box>
                </PremiumCard>

                <PremiumCard borderLeft="4px solid #ef4444">
                    <StatLabel>Inventory Help</StatLabel>
                    <StatValue color={stats.lowStockAlerts > 0 ? "#991b1b" : "#10b981"}>{stats.lowStockAlerts}</StatValue>
                    <Box mt="md" display="flex" alignItems="center">
                        <Text color="#991b1b" fontWeight="bold" variant="sm">Low Stock Alerts</Text>
                    </Box>
                </PremiumCard>

                <PremiumCard borderLeft="4px solid #06b6d4">
                    <StatLabel>Revenue</StatLabel>
                    <StatValue>₹{(stats.totalRevenue || 0).toLocaleString()}</StatValue>
                    <Box mt="md" display="flex" alignItems="center">
                        <Text color="#06b6d4" fontWeight="bold" variant="sm">Total Delivered Revenue</Text>
                    </Box>
                </PremiumCard>
            </Box>

            {/* Alphabetical Catalog Search */}
            <Box mb="xxxl">
                <Text color="#0f172a" fontSize="24px" fontWeight="800" mb="xl">Browse Products by Alphabet</Text>
                <Box bg="white" p="xl" borderRadius="24px" border="1px solid #f1f5f9" boxShadow="0 4px 6px -1px rgba(0,0,0,0.05)">
                    <Box display="flex" flexWrap="wrap" style={{ gap: '8px' }}>
                        {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
                            <Button 
                                key={letter} 
                                size="sm" 
                                variant="light" 
                                as="a" 
                                href={`/admin/resources/Product?letter=${letter}`}
                                style={{ minWidth: '42px', height: '42px', borderRadius: '12px' }}
                            >
                                {letter}
                            </Button>
                        ))}
                        <Button 
                            size="sm" 
                            variant="primary" 
                            as="a" 
                            href="/admin/resources/Product"
                            style={{ padding: '0 20px', height: '42px', borderRadius: '12px' }}
                        >
                            VIEW ALL PRODUCTS
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* Recent Orders Table */}
            {recentOrders.length > 0 && (
                <Box mb="xxxl">
                    <Text color="#0f172a" fontSize="24px" fontWeight="800" mb="xl">Live Activity Feed</Text>
                    <Box bg="white" p="xl" borderRadius="24px" border="1px solid #f1f5f9">
                        <Table width="100%">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Order ID</TableCell>
                                    <TableCell>Price</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {recentOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell><Text fontWeight="bold">{order.params.orderId || order.id}</Text></TableCell>
                                        <TableCell>₹{order.params.totalPrice}</TableCell>
                                        <TableCell>
                                            <Badge variant={order.params.status === 'delivered' ? 'success' : 'info'}>
                                                {order.params.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(order.params.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Button size="sm" as="a" href={`/admin/resources/Order/records/${order.id}/show`}>
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                </Box>
            )}

            {/* Quick Actions & Maintenance */}
            <Box display="grid" gridTemplateColumns={["1fr", "1fr", "2fr 1fr"]} gridGap="40px">
                <Box>
                    <Text color="#0f172a" fontSize="24px" fontWeight="800" mb="xl">Resource Shortcuts</Text>
                    <Box display="grid" gridTemplateColumns={["1fr", "1fr 1fr"]} gridGap="16px">
                        <ActionButton as="a" href="/admin/resources/Order">
                            <Box bg="rgba(16, 185, 129, 0.1)" p="md" borderRadius="12px" mr="md">
                                <Icon icon="ShoppingCart" color="#10b981" />
                            </Box>
                            <Box>
                                <Text fontWeight="bold">Orders Queue</Text>
                                <Text variant="sm" color="#64748b">Live fulfillment center</Text>
                            </Box>
                        </ActionButton>
                        
                        <ActionButton as="a" href="/admin/resources/Product">
                            <Box bg="rgba(59, 130, 246, 0.1)" p="md" borderRadius="12px" mr="md">
                                <Icon icon="Package" color="#3b82f6" />
                            </Box>
                            <Box>
                                <Text fontWeight="bold">Inventory Manager</Text>
                                <Text variant="sm" color="#64748b">Update items and pricing</Text>
                            </Box>
                        </ActionButton>

                        <ActionButton as="a" href="/admin/resources/Coupon">
                            <Box bg="rgba(244, 63, 94, 0.1)" p="md" borderRadius="12px" mr="md">
                                <Icon icon="Tag" color="#f43f5e" />
                            </Box>
                            <Box>
                                <Text fontWeight="bold">Campaign Hub</Text>
                                <Text variant="sm" color="#64748b">Marketing & Discounts</Text>
                            </Box>
                        </ActionButton>

                        <ActionButton as="a" href="/admin/resources/Customer">
                            <Box bg="rgba(107, 114, 128, 0.1)" p="md" borderRadius="12px" mr="md">
                                <Icon icon="Users" color="#6b7280" />
                            </Box>
                            <Box>
                                <Text fontWeight="bold">User Directory</Text>
                                <Text variant="sm" color="#64748b">Database of all users</Text>
                            </Box>
                        </ActionButton>
                    </Box>
                </Box>

                <Box>
                  <PremiumCard bg="#047857">
                    <Text color="white" fontSize="20px" fontWeight="900" mb="md">System Maintenance</Text>
                    <Text color="rgba(255,255,255,0.8)" mb="xl" lineHeight="1.6">
                      Running in production mode. Data is synced in real-time with Mongo Atlas.
                    </Text>
                    <Button variant="secondary" as="a" href="/admin/pages/Component Guide" width="100%">
                        Builder Instructions
                    </Button>
                  </PremiumCard>
                </Box>
            </Box>
        </Box>
    );
};

export default Dashboard;
