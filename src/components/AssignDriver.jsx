import React, { useState, useEffect } from 'react';
import { Box, Button, FormGroup, Label, Select, Text, Loader } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const AssignDriver = (props) => {
    const { record, resource, action } = props;
    const [drivers, setDrivers] = useState([]);
    const [selectedDriverId, setSelectedDriverId] = useState('');
    const [deliveryFee, setDeliveryFee] = useState(record.params.driverEarning || '');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const api = new ApiClient();

    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                // Fetch DeliveryPartner resource records
                const response = await api.resourceAction({
                    resourceId: 'DeliveryPartner',
                    actionName: 'list',
                });

                if (response.data.records) {
                    const activeDrivers = response.data.records
                        .filter(r => r.params.isActivated === true || r.params.isActivated === 'true')
                        .map(r => ({
                            value: r.id,
                            label: `${r.params.name} (${r.params.email})`,
                        }));
                    setDrivers(activeDrivers);
                }
            } catch (error) {
                console.error('Failed to fetch drivers:', error);
            } finally {
                setFetching(false);
            }
        };

        fetchDrivers();
    }, []);

    const handleAssign = async () => {
        if (!selectedDriverId) {
            alert('Please select a driver');
            return;
        }

        setLoading(true);
        try {
            const response = await api.resourceAction({
                resourceId: resource.id,
                actionName: action.name,
                method: 'post',
                data: {
                    driverId: selectedDriverId,
                    driverEarning: deliveryFee
                },
                recordId: record.id,
            });

            if (response.data.notice) {
                alert(response.data.notice.message);
                // Intelligent redirect based on current resource
                if (resource.id === 'OrderAssignment') {
                    window.location.href = `/admin/resources/OrderAssignment`;
                } else {
                    window.location.href = `/admin/resources/Order/records/${record.id}/show`;
                }
            }
        } catch (error) {
            console.error('Failed to assign driver:', error);
            const errMsg = error.response?.data?.notice?.message || error.message || 'Unknown error';
            alert(`Error assigning driver: ${errMsg}`);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <Loader />;

    return (
        <Box variant="white" padding="xl" minHeight="400px">
            <Text variant="lg" mb="xl">
                Assign Driver to Order {record.params.orderId || "N/A"}
            </Text>

            <FormGroup>
                <Label>Select Delivery Partner</Label>
                <Select
                    value={drivers.find(d => d.value === selectedDriverId)}
                    options={drivers}
                    onChange={(selected) => setSelectedDriverId(selected.value)}
                />
            </FormGroup>

            <FormGroup mt="lg">
                <Label>Delivery Fee (₹)</Label>
                <input
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #C0C0C0',
                        fontSize: '14px'
                    }}
                    placeholder="Enter delivery fee"
                />
            </FormGroup>

            <Box mt="xl">
                <Button
                    variant="primary"
                    onClick={handleAssign}
                    disabled={loading || drivers.length === 0}
                >
                    {loading ? 'Assigning...' : 'Assign Driver'}
                </Button>
            </Box>

            {drivers.length === 0 && (
                <Box mt="lg">
                    <Text variant="sm" color="red">
                        No active delivery partners found.
                    </Text>
                </Box>
            )}
        </Box>
    );
};

export default AssignDriver;
