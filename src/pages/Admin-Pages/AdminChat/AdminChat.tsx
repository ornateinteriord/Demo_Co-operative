import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatList from '../../../components/Chat/ChatList';
import ChatWindow from '../../../components/Chat/ChatWindow';
import { useChatSocket, ChatRoom } from '../../../hooks/useChatSocket';
import { initializeSocket } from '../../../utils/socket';
import { get, patch } from '../../../api/Api';
import { jwtDecode } from 'jwt-decode';
import TokenService from '../../../api/token/tokenService';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Search, LayoutDashboard } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminChat: React.FC = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [isLoadingRooms, setIsLoadingRooms] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [showChatWindow, setShowChatWindow] = useState(false);

    const selectedRoom = rooms.find((r) => r.roomId === selectedRoomId);
    const otherParticipantId = selectedRoom?.participants.find(p => p !== currentUserId);

    const { messages, setMessages, isConnected, recipientOnline, isTyping, sendMessage, sendTypingIndicator, deleteMessage } = useChatSocket(selectedRoomId, otherParticipantId);

    useEffect(() => {
        try {
            const token = TokenService.getToken();
            if (token) {
                const decoded: any = jwtDecode(token);
                if (decoded.role === 'admin' || decoded.role === 'ADMIN') setCurrentUserId(`ADMIN_${decoded.id || '1'}`);
                else setCurrentUserId(decoded.Member_id || decoded.id || '');
            }
            const socket = initializeSocket();
            if (!socket.connected) socket.connect();
        } catch (error) {
            console.error('Failed to initialize chat:', error);
        }
    }, []);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                setIsLoadingRooms(true);
                const response = await get('/chat/rooms');
                if (response.success) setRooms(response.data || []);
            } catch (error) { console.error(error); }
            finally { setIsLoadingRooms(false); }
        };
        if (currentUserId) fetchRooms();
    }, [currentUserId]);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!selectedRoomId) return;
            try {
                setIsLoadingMessages(true);
                const response = await get(`/chat/messages/${selectedRoomId}`);
                if (response.success) {
                    setMessages(response.data || []);
                    await patch(`/chat/mark-read/${selectedRoomId}`);
                    setRooms(prev => prev.map(r => r.roomId === selectedRoomId ? { ...r, unreadCount: 0 } : r));
                }
            } catch (error) { toast.error('Failed to load messages'); }
            finally { setIsLoadingMessages(false); }
        };
        fetchMessages();
    }, [selectedRoomId, setMessages]);

    const handleSelectRoom = (roomId: string) => {
        setSelectedRoomId(roomId);
        setShowChatWindow(true);
    };

    const otherParticipant = selectedRoom?.participantDetails.find((p) => p.memberId !== currentUserId);
    const totalUnread = rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0);

    return (
        <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', mt: 7 }}>
            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <Box sx={{ width: { xs: '100%', lg: 400 }, flexShrink: 0, display: { xs: showChatWindow ? 'none' : 'flex', lg: 'flex' }, flexDirection: 'column' }}>
                    <Box sx={{ p: 2, background: 'linear-gradient(135deg, #ff9800 0%, #f44336 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="h6" fontWeight={700}>Admin Chat</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>{rooms.length} conversation{rooms.length !== 1 ? 's' : ''}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="h4" fontWeight={700}>{totalUnread}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.9 }}>Unread</Typography>
                            </Box>
                            <Button variant="contained" startIcon={<LayoutDashboard size={18} />} onClick={() => navigate('/admin/dashboard')} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', fontWeight: 600 }}>Dashboard</Button>
                        </Box>
                    </Box>
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                        <ChatList rooms={rooms} selectedRoomId={selectedRoomId} onSelectRoom={handleSelectRoom} isLoading={isLoadingRooms} currentUserId={currentUserId} />
                    </Box>
                </Box>
                <Box sx={{ flex: 1, display: { xs: !showChatWindow && !selectedRoomId ? 'none' : 'flex', lg: 'flex' } }}>
                    {selectedRoomId ? (
                        <ChatWindow 
                            roomId={selectedRoomId} 
                            messages={messages} 
                            onSendMessage={sendMessage} 
                            onTyping={sendTypingIndicator} 
                            isConnected={isConnected} 
                            isRecipientOnline={recipientOnline}
                            isTyping={isTyping} 
                            isLoading={isLoadingMessages} 
                            recipientName={otherParticipant?.name || 'User'} 
                            recipientRole={otherParticipant?.role || 'user'} 
                            onDeleteMessage={deleteMessage}
                            onBack={() => { setShowChatWindow(false); setSelectedRoomId(''); }} 
                        />
                    ) : (
                        <Box sx={{ display: { xs: 'none', lg: 'flex' }, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', bgcolor: 'background.default', flex: 1 }}>
                            <Paper sx={{ width: 96, height: 96, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(244, 67, 54, 0.1) 100%)', mb: 3, boxShadow: 3 }}>
                                <Search size={48} color="#ff9800" />
                            </Paper>
                            <Typography variant="h5" fontWeight={600} gutterBottom>Admin Support Chat</Typography>
                            <Typography variant="body2" color="text.secondary" maxWidth={400} textAlign="center" mb={3}>Select a conversation to view and respond to user messages</Typography>
                            {totalUnread > 0 && <Paper sx={{ px: 3, py: 1, bgcolor: 'warning.light', color: 'warning.contrastText', borderRadius: 2 }}><Typography variant="body2" fontWeight={500}>You have {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}</Typography></Paper>}
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default AdminChat;
