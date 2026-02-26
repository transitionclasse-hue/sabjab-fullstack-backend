import React, { useState, useEffect } from 'react';
import { Box, Button, FormGroup, Label, Select, Text, Loader } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const AssignDriver = (props) => {
    const { record, resource, action } = props;
    const [drivers, setDrivers] = useState([]);
    const [selectedDriverId, setSelectedDriverId] = useState('');
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
                data: { driverId: selectedDriverId },
                recordId: record.id,
            });

            if (response.data.notice) {
                alert(response.data.notice.message);
                // Optionally redirect or refresh
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to assign driver:', error);
            alert('Error assigning driver. Check console.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <Loader />;

    return (
        <Box variant="white" padding="xl">
            <Text variant="lg" mb="xl">
                Assign Driver to Order {record.params.orderId || record.id}
            </Text>

            <FormGroup>
                <Label>Select Delivery Partner</Label>
                <Select
                    value={drivers.find(d => d.value === selectedDriverId)}
                    options={drivers}
                    onChange={(selected) => setSelectedDriverId(selected.value)}
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
