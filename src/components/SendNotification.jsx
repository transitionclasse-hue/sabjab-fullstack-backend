import React, { useState } from 'react';
import { Box, Button, FormGroup, Input, Label, Text, TextArea, MessageBox } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const SendNotification = (props) => {
    const { record, resource, action } = props;
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [pushToDrivers, setPushToDrivers] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const api = new ApiClient();

    const handleSend = async () => {
        setSuccessMessage('');
        setErrorMessage('');

        if (!title || !body) {
            setErrorMessage('Title and Body are absolutely required. Please fill them out.');
            return;
        }

        setLoading(true);
        try {
            const payload = { title, body, userType: pushToDrivers ? "DeliveryPartner" : "Customer" };

            // If it's a record action (Individual), we already have the user ID context via recordId
            // If it's a resource action (Broadcast), it broadcasts to the chosen userType
            const response = await api.resourceAction({
                resourceId: resource.id,
                actionName: action.name,
                method: 'post',
                data: payload,
                recordId: record ? record.id : undefined,
            });

            if (response.data.notice && response.data.notice.type === 'success') {
                setSuccessMessage(response.data.notice.message);
            } else {
                setSuccessMessage('Notification sent successfully!');
            }

            // Reset form after success if it's a broadcast
            if (!record) {
                setTitle('');
                setBody('');
            }
        } catch (error) {
            console.error('Failed to send notification:', error);
            setErrorMessage('Error sending notification. Please check server logs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box variant="white" padding="xxl" style={{ maxWidth: 600, margin: '0 auto', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Text variant="h3" mb="lg" fontWeight="bold">
                {record ? `Direct Message: ${record.params.name || 'User'}` : 'Broadcast Push Notification'}
            </Text>

            {record && (
                <Text variant="sm" color="grey60" mb="xl">
                    This notification will be sent immediately to a single device (if they have push notifications enabled).
                </Text>
            )}

            {successMessage && (
                <Box mb="lg">
                    <MessageBox variant="success" message={successMessage} />
                </Box>
            )}

            {errorMessage && (
                <Box mb="lg">
                    <MessageBox variant="danger" message={errorMessage} />
                </Box>
            )}

            {!record && (
                <FormGroup>
                    <Label fontWeight="bold">Select Target Audience</Label>
                    <Text variant="sm" color="grey60" mb="default">
                        Who should receive this broadcast alert on their mobile devices?
                    </Text>
                    <Box flex flexDirection="row" alignItems="center" mt="sm">
                        <Button
                            variant={!pushToDrivers ? "primary" : "secondary"}
                            onClick={() => setPushToDrivers(false)}
                            mr="default"
                            size="lg"
                        >
                            🛍️ All Customers
                        </Button>
                        <Button
                            variant={pushToDrivers ? "primary" : "secondary"}
                            onClick={() => setPushToDrivers(true)}
                            size="lg"
                        >
                            🛵 All Drivers
                        </Button>
                    </Box>
                </FormGroup>
            )}

            <FormGroup mt="xl">
                <Label fontWeight="bold">Notification Title</Label>
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={pushToDrivers ? "e.g., Rain Surge Active! 🌧️" : "e.g., Flash Sale! ⚡️"}
                    width={1}
                    size="lg"
                />
            </FormGroup>

            <FormGroup>
                <Label fontWeight="bold">Notification Body</Label>
                <TextArea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={pushToDrivers ? "Login now to earn extra ₹20 per order!" : "Get 50% off on all fresh vegetables for the next 2 hours!"}
                    rows={5}
                    width={1}
                />
            </FormGroup>

            <Box mt="xxl" pt="lg" borderTop="1px solid #eee">
                <Button
                    variant="primary"
                    onClick={handleSend}
                    disabled={loading}
                    size="lg"
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    {loading ? 'Sending & Delivering...' : (record ? 'Send Direct Message Now' : `Broadcast to ${pushToDrivers ? 'All Drivers' : 'All Customers'}`)}
                </Button>
            </Box>

            {!record && (
                <Box mt="lg" textAlign="center">
                    <Text variant="sm" color="grey40">
                        ⚡️ Broadcasts are sent asynchronously via Expo servers.
                    </Text>
                </Box>
            )}
        </Box>
    );
};

export default SendNotification;
