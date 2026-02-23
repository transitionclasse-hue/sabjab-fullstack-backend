import React, { useState } from 'react';
import { Box, Button, TextArea, Label, FormGroup, useNotice, Text } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const SupportReply = (props) => {
    const { record, resource, action } = props;
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const sendNotice = useNotice();
    const api = new ApiClient();

    const handleSend = async () => {
        if (!message.trim()) return;
        setLoading(true);

        try {
            await api.recordAction({
                resourceId: resource.id,
                recordId: record.id,
                actionName: action.name,
                payload: { replyMessage: message },
                method: 'post'
            });

            sendNotice({ message: 'Reply sent successfully!', type: 'success' });
            setMessage('');
            // Redirect back to list
            window.location.href = `/admin/resources/${resource.id}`;
        } catch (error) {
            console.error('Reply failed:', error);
            sendNotice({ message: 'Failed to send reply', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box variant="white" padding="xl">
            <Box marginBottom="xl">
                <Label>User's Last Message:</Label>
                <Box padding="m" backgroundColor="grey20" borderRadius="default">
                    <Text>{record.params.message}</Text>
                </Box>
            </Box>

            <FormGroup>
                <Label>Your Reply:</Label>
                <TextArea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your response here..."
                    rows={5}
                />
            </FormGroup>

            <Box marginTop="xl">
                <Button
                    variant="primary"
                    onClick={handleSend}
                    disabled={loading || !message.trim()}
                >
                    {loading ? 'Sending...' : 'Send Reply'}
                </Button>
            </Box>
        </Box>
    );
};

export default SupportReply;
