import React, { useState } from 'react';
import { Box, Button, FormGroup, Input, Label, Text, TextArea } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const SendNotification = (props) => {
    const { record, resource, action } = props;
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const api = new ApiClient();

    const handleSend = async () => {
        if (!title || !body) {
            alert('Title and Body are required');
            return;
        }

        setLoading(false);
        try {
            setLoading(true);
            const payload = { title, body };

            // If it's a record action (Individual), we already have the customer
            // If it's a resource action (Broadcast), we don't.

            const response = await api.resourceAction({
                resourceId: resource.id,
                actionName: action.name,
                method: 'post',
                data: payload,
                recordId: record ? record.id : undefined,
            });

            if (response.data.notice) {
                alert(response.data.notice.message);
            }

            // Reset after success if it's a broadcast
            if (!record) {
                setTitle('');
                setBody('');
            }
        } catch (error) {
            console.error('Failed to send notification:', error);
            alert('Error sending notification. Check console.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box variant="white" padding="xl">
            <Text variant="lg" mb="xl">
                {record ? `Send Individual Notification to ${record.params.name || 'Customer'}` : 'Broadcast Push Notification to All Users'}
            </Text>

            <FormGroup>
                <Label>Notification Title</Label>
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Flash Sale! ⚡️"
                    width={1}
                />
            </FormGroup>

            <FormGroup>
                <Label>Notification Body</Label>
                <TextArea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="e.g., Get 50% off on all fresh vegetables for the next 2 hours!"
                    rows={4}
                    width={1}
                />
            </FormGroup>

            <Box mt="xl">
                <Button
                    variant="primary"
                    onClick={handleSend}
                    disabled={loading}
                >
                    {loading ? 'Sending...' : (record ? 'Send Now' : 'Broadcast to All Customers')}
                </Button>
            </Box>

            {!record && (
                <Box mt="lg">
                    <Text variant="sm" color="grey60">
                        Note: This will be sent as a Push Notification to ALL customers who have registered a push token and enabled notifications.
                    </Text>
                </Box>
            )}
        </Box>
    );
};

export default SendNotification;
