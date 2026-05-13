import React, { useState, useEffect } from 'react';
import ChatList from '../../../components/Chat/ChatList';
import ChatWindow from '../../../components/Chat/ChatWindow';
import NewChatDialog from '../../../components/Chat/NewChatDialog';
import { useChatSocket, ChatRoom } from '../../../hooks/useChatSocket';
import { initializeSocket } from '../../../utils/socket';
import { get, patch } from '../../../api/Api';
import { jwtDecode } from 'jwt-decode';
import TokenService from '../../../api/token/tokenService';
import { Box, Typography, Paper } from '@mui/material';
import { Search } from 'lucide-react';

const Chat: React.FC = () => {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [isLoadingRooms, setIsLoadingRooms] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [showChatWindow, setShowChatWindow] = useState(false);
    const [showNewChatDialog, setShowNewChatDialog] = useState(false);
    const [directMembers, setDirectMembers] = useState<any[]>([]);

    const selectedRoom = rooms.find((r) => r.roomId === selectedRoomId);
    const otherParticipantId = selectedRoom?.participants.find(p => p !== currentUserId);

    const { messages, setMessages, isConnected, recipientOnline, isTyping, sendMessage, sendTypingIndicator, deleteMessage } = useChatSocket(selectedRoomId, otherParticipantId);

    useEffect(() => {
        try {
            const token = TokenService.getToken();
            if (token) {
                const decoded: any = jwtDecode(token);
                const userId = decoded.Member_id || decoded.memberId || decoded.id || '';
                setCurrentUserId(userId);
            }
            const socket = initializeSocket();
            if (!socket.connected) socket.connect();
            return () => { window.dispatchEvent(new CustomEvent('active-chat-room', { detail: null })); };
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
            } catch (error) {
                console.error('Failed to fetch rooms:', error);
            } finally {
                setIsLoadingRooms(false);
            }
        };
        if (currentUserId) fetchRooms();
    }, [currentUserId]);

    useEffect(() => {
        const fetchDirectMembers = async () => {
            try {
                const response = await get(`/user/sponsers/${currentUserId}`);
                if (response.success) {
                    setDirectMembers(response.sponsoredUsers || []);
                }
            } catch (error) {
                console.error('Failed to fetch direct members:', error);
            }
        };
        if (currentUserId) fetchDirectMembers();
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
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            } finally {
                setIsLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [selectedRoomId, setMessages]);

    const handleSelectRoom = (roomId: string) => {
        setSelectedRoomId(roomId);
        setShowChatWindow(true);
        window.dispatchEvent(new CustomEvent('active-chat-room', { detail: roomId }));
    };

    const handleChatCreated = async (roomId: string) => {
        try {
            const response = await get('/chat/rooms');
            if (response.success) setRooms(response.data || []);
        } catch (error) { console.error(error); }
        setSelectedRoomId(roomId);
        setShowChatWindow(true);
    };

    // Merge actual rooms with direct members who don't have a room yet
    const allDisplayRooms = [...rooms];
    
    directMembers.forEach(member => {
        const roomId = [currentUserId, member.Member_id].sort().join('_');
        const exists = rooms.some(r => r.roomId === roomId);
        
        if (!exists) {
            allDisplayRooms.push({
                roomId: roomId,
                participants: [currentUserId, member.Member_id],
                participantDetails: [
                    { memberId: currentUserId, name: 'Me', role: 'USER', profileImage: '' },
                    { memberId: member.Member_id, name: member.Name, role: 'USER', profileImage: member.profile_image || '' }
                ],
                lastMessage: 'Start a new conversation',
                lastMessageTime: '',
                unreadCount: 0
            });
        }
    });

    const otherParticipant = selectedRoom?.participantDetails.find((p) => p.memberId !== currentUserId);

    return (
        <Box sx={{ 
            height: { 
                xs: 'calc(100dvh - 56px)', // Removed 70px since bottom nav is hidden
                md: 'calc(100vh - 64px)'
            }, 
            display: 'flex', 
            flexDirection: 'column', 
            mt: 0, 
            overflow: 'hidden' 
        }}>
            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
                <Box sx={{ width: { xs: '100%', lg: 400 }, flexShrink: 0, display: { xs: showChatWindow ? 'none' : 'block', lg: 'block' } }}>
                    <ChatList rooms={allDisplayRooms.filter(r => !r.roomId.includes('ADMIN_'))} selectedRoomId={selectedRoomId} onSelectRoom={handleSelectRoom} isLoading={isLoadingRooms} currentUserId={currentUserId} onNewChat={() => setShowNewChatDialog(true)} />
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
                            onBack={() => { setShowChatWindow(false); setSelectedRoomId(''); window.dispatchEvent(new CustomEvent('active-chat-room', { detail: null })); }} 
                        />
                    ) : (
                        <Box sx={{ display: { xs: 'none', lg: 'flex' }, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', bgcolor: 'background.default', flex: 1 }}>
                            <Paper sx={{ width: 96, height: 96, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)', mb: 3, boxShadow: 3 }}>
                                <Search size={48} color="#1976d2" />
                            </Paper>
                            <Typography variant="h5" fontWeight={600} gutterBottom>Select a conversation</Typography>
                            <Typography variant="body2" color="text.secondary" maxWidth={400} textAlign="center">Choose a conversation from the list to start chatting</Typography>
                        </Box>
                    )}
                </Box>
            </Box>
            <NewChatDialog open={showNewChatDialog} onClose={() => setShowNewChatDialog(false)} onChatCreated={handleChatCreated} />
        </Box>
    );
};

export default Chat;
