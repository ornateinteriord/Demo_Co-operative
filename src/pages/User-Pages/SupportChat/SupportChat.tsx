import React, { useState, useEffect } from 'react';
import ChatWindow from '../../../components/Chat/ChatWindow';
import { useChatSocket, ChatRoom } from '../../../hooks/useChatSocket';
import { initializeSocket } from '../../../utils/socket';
import { get, patch } from '../../../api/Api';
import { jwtDecode } from 'jwt-decode';
import TokenService from '../../../api/token/tokenService';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { Headphones } from 'lucide-react';
import { toast } from 'react-toastify';

const SupportChat: React.FC = () => {
    const [supportRoom, setSupportRoom] = useState<ChatRoom | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const otherParticipantId = supportRoom?.participants.find(p => p !== currentUserId);

    const {
        messages,
        setMessages,
        isConnected,
        recipientOnline,
        isTyping,
        sendMessage,
        sendTypingIndicator,
        deleteMessage,
    } = useChatSocket(supportRoom?.roomId, otherParticipantId);

    useEffect(() => {
        const initSupportChat = async () => {
            try {
                const token = TokenService.getToken();
                if (token) {
                    const decoded: any = jwtDecode(token);
                    const userId = decoded.Member_id || decoded.memberId || decoded.id || '';
                    setCurrentUserId(userId);
                }

                const socket = initializeSocket();
                if (!socket.connected) {
                    socket.connect();
                }

                setIsLoading(true);
                const response = await get('/chat/support');

                if (response.success && response.data) {
                    setSupportRoom(response.data);
                }
            } catch (error: any) {
                console.error('Failed to connect to support:', error);
                toast.error('Failed to connect to support');
            } finally {
                setIsLoading(false);
            }
        };

        initSupportChat();
    }, []);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!supportRoom?.roomId) return;

            try {
                setIsLoadingMessages(true);
                const response = await get(`/chat/messages/${supportRoom.roomId}`);

                if (response.success) {
                    setMessages(response.data || []);
                    await patch(`/chat/mark-read/${supportRoom.roomId}`);
                }
            } catch (error: any) {
                console.error('Failed to fetch messages:', error);
            } finally {
                setIsLoadingMessages(false);
            }
        };

        fetchMessages();
    }, [supportRoom?.roomId, setMessages]);

    const handleSendMessage = (text: string, attachment?: { imageUrl: string; messageType: string; fileName: string; fileSize: number }) => {
        sendMessage(text, attachment);
    };

    const adminParticipant = supportRoom?.participantDetails.find(
        (p) => p.memberId !== currentUserId
    );

    if (isLoading) {
        return (
            <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mt: 9 }}>
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ mt: 3 }}>Connecting to Support...</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Please wait while we connect you to our support team</Typography>
            </Box>
        );
    }

    if (!supportRoom) {
        return (
            <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mt: 9 }}>
                <Paper sx={{ width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%)', mb: 3 }}>
                    <Headphones size={40} color="#f44336" />
                </Paper>
                <Typography variant="h5" fontWeight={600} gutterBottom>Support Unavailable</Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400}>We're sorry, but support is currently unavailable. Please try again later.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', mt: 7 }}>
            <Box sx={{ p: 2, background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', color: '#fff', textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Headphones size={24} /><Typography variant="h6" fontWeight={600}>Support Chat</Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Chat with our support team for any assistance</Typography>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <ChatWindow 
                    roomId={supportRoom.roomId} 
                    messages={messages} 
                    onSendMessage={handleSendMessage} 
                    onTyping={sendTypingIndicator} 
                    isConnected={isConnected} 
                    isRecipientOnline={recipientOnline}
                    isTyping={isTyping} 
                    isLoading={isLoadingMessages} 
                    recipientName={adminParticipant?.name || 'Support'} 
                    recipientRole="admin" 
                    onDeleteMessage={deleteMessage}
                />
            </Box>
        </Box>
    );
};

export default SupportChat;
