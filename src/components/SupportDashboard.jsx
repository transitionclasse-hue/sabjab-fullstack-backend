import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, Button, TextArea, Label, Icon, useNotice } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';
import { io } from 'socket.io-client';

const SupportDashboard = () => {
    const [conversations, setConversations] = useState({}); // { userId: { messages: [], customerName: '', customerPhone: '' } }
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [socket, setSocket] = useState(null);
    const lastMessageRef = useRef(null);
    const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'));
    const api = new ApiClient();

    useEffect(() => {
        const newSocket = io(window.location.origin, { transports: ['websocket'] });
        setSocket(newSocket);

        newSocket.emit('joinSupport', 'admin');

        newSocket.on('adminNewMessage', (data) => {
            const { userId, message, customerName, customerPhone } = data;

            // Play sound if message is from a customer
            if (message.sender === 'customer') {
                audioRef.current.play().catch(e => console.log('Audio play failed:', e));
            }

            setConversations(prev => {
                const existing = prev[userId] || { messages: [], customerName: customerName || 'New User', customerPhone: customerPhone || '' };
                return {
                    ...prev,
                    [userId]: {
                        ...existing,
                        customerName: customerName || existing.customerName,
                        customerPhone: customerPhone || existing.customerPhone,
                        messages: [...existing.messages, message]
                    }
                };
            });
        });

        return () => newSocket.disconnect();
    }, []);

    useEffect(() => {
        if (lastMessageRef.current) {
            lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedUserId, conversations]);

    const handleSend = () => {
        if (!replyText.trim() || !selectedUserId || !socket) return;

        socket.emit('supportChatMessage', {
            userId: selectedUserId,
            sender: 'support',
            message: replyText
        });

        setReplyText('');
    };

    const activeUsers = Object.keys(conversations);

    return (
        <Box variant="white" display="flex" flexDirection="row" height="100vh">
            {/* Sidebar - Active Conversations */}
            <Box width="300px" borderRight="1px solid #eee" overflowY="auto" backgroundColor="grey20">
                <Box padding="xl" borderBottom="1px solid #eee">
                    <Text fontWeight="bold" fontSize="lg">Active Chats</Text>
                </Box>
                {activeUsers.length === 0 ? (
                    <Box padding="xl">
                        <Text color="grey60">No active chats...</Text>
                    </Box>
                ) : (
                    activeUsers.map(uid => (
                        <Box
                            key={uid}
                            padding="l"
                            onClick={() => setSelectedUserId(uid)}
                            cursor="pointer"
                            backgroundColor={selectedUserId === uid ? 'white' : 'transparent'}
                            borderBottom="1px solid #eee"
                        >
                            <Box display="flex" flexDirection="row" alignItems="center">
                                <Icon icon="User" size={16} marginRight="s" color="primary100" />
                                <Text fontWeight="bold">{conversations[uid].customerName}</Text>
                            </Box>
                            <Text fontSize="xs" color="grey40" marginTop="xs">{conversations[uid].customerPhone}</Text>
                            <Text fontSize="sm" color="grey60" marginTop="s" numberOfLines={1}>
                                {conversations[uid].messages.slice(-1)[0]?.message}
                            </Text>
                        </Box>
                    ))
                )}
            </Box>

            {/* Main Chat Area */}
            <Box flex={1} display="flex" flexDirection="column" backgroundColor="white">
                {selectedUserId ? (
                    <>
                        <Box padding="xl" borderBottom="1px solid #eee" display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Text fontWeight="bold" fontSize="lg">{conversations[selectedUserId].customerName}</Text>
                                <Text fontSize="xs" color="grey60">{conversations[selectedUserId].customerPhone}</Text>
                            </Box>
                            <Box display="flex" alignItems="center">
                                <Box width="8px" height="8px" borderRadius="4px" backgroundColor="green" marginRight="s" />
                                <Text fontSize="xs" color="green">Connected</Text>
                            </Box>
                        </Box>

                        <Box flex={1} padding="xl" overflowY="auto">
                            {conversations[selectedUserId].messages.map((msg, idx) => {
                                const isMe = msg.sender === 'support';
                                return (
                                    <Box
                                        key={idx}
                                        marginVertical="s"
                                        display="flex"
                                        flexDirection="column"
                                        alignItems={isMe ? 'flex-end' : 'flex-start'}
                                    >
                                        <Box
                                            padding="m"
                                            backgroundColor={isMe ? 'primary100' : 'grey20'}
                                            color={isMe ? 'white' : 'black'}
                                            borderRadius="default"
                                            maxWidth="70%"
                                        >
                                            <Text>{msg.message}</Text>
                                        </Box>
                                        <Text fontSize="xs" color="grey60" marginTop="xs">
                                            {new Date(msg.createdAt).toLocaleTimeString()}
                                        </Text>
                                    </Box>
                                )
                            })}
                            <div ref={lastMessageRef} />
                        </Box>

                        <Box padding="xl" borderTop="1px solid #eee" display="flex">
                            <TextArea
                                flex={1}
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                placeholder="Type WhatsApp-style reply..."
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                            />
                            <Button marginLeft="m" variant="primary" onClick={handleSend}>
                                <Icon icon="Send" />
                            </Button>
                        </Box>
                    </>
                ) : (
                    <Box flex={1} display="flex" justifyContent="center" alignItems="center">
                        <Box textAlign="center">
                            <Icon icon="MessageSquare" size={48} color="grey40" />
                            <Text marginTop="m" color="grey60">Select a conversation to start chatting</Text>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default SupportDashboard;
