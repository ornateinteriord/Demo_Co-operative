import React, { useEffect, useRef, useState, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { Message } from '../../hooks/useChatSocket';
import {
    Box, AppBar, Toolbar, Avatar, Typography, IconButton,
    CircularProgress, Paper, useMediaQuery, useTheme, Slide
} from '@mui/material';
import { ArrowBack, Circle, WifiOff, Close } from '@mui/icons-material';
import { Reply, Copy, Trash2, User } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import TokenService from '../../api/token/tokenService';
import { styled } from '@mui/material/styles';
import { toast } from 'react-toastify';

interface ChatWindowProps {
    roomId: string;
    messages: Message[];
    onSendMessage: (text: string) => void;
    onTyping?: (isTyping: boolean) => void;
    isConnected: boolean;
    isRecipientOnline?: boolean;
    isTyping?: boolean;
    isLoading?: boolean;
    recipientName?: string;
    recipientRole?: string;
    onBack?: () => void;
    onDeleteMessage?: (messageId: string) => void;
}

const ChatHeader = styled(AppBar)(({ theme }) => ({
    background: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[1],
    position: 'static',
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
    flex: 1,
    overflowY: 'auto',
    minHeight: 0,
    padding: theme.spacing(3),
    backgroundColor: theme.palette.mode === 'dark' ? '#0b141a' : '#e5ddd5',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
}));

const ChatWindow: React.FC<ChatWindowProps> = ({
    messages,
    onSendMessage,
    onTyping,
    isConnected,
    isRecipientOnline = false,
    isTyping = false,
    isLoading = false,
    recipientName = 'User',
    recipientRole = 'user',
    onBack,
    onDeleteMessage,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentUserId = useRef<string>('');
    const containerRef = useRef<HTMLDivElement>(null);
    const prevMessagesLength = useRef(messages.length);

    // Mobile: the message currently selected via long-press
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

    const isSentMessage = selectedMessage
        ? selectedMessage.senderId === currentUserId.current
        : false;

    const handleSelectMessage = useCallback((msg: Message | null) => {
        setSelectedMessage(msg);
    }, []);

    const clearSelection = () => setSelectedMessage(null);

    // Mobile action: Reply
    const handleMobileReply = () => {
        // Reply is a no-op here since we don't have a reply callback —
        // but we wire it the same way as desktop for future use
        toast.info('Reply coming soon');
        clearSelection();
    };

    // Mobile action: Copy
    const handleMobileCopy = () => {
        if (selectedMessage?.text) {
            navigator.clipboard.writeText(selectedMessage.text);
            toast.success('Text copied to clipboard');
        }
        clearSelection();
    };

    // Mobile action: Delete
    const handleMobileDelete = () => {
        if (selectedMessage?._id && onDeleteMessage) {
            onDeleteMessage(selectedMessage._id);
        }
        clearSelection();
    };

    useEffect(() => {
        try {
            const token = TokenService.getToken();
            if (token) {
                const decoded: any = jwtDecode(token);
                if (decoded.role === 'admin' || decoded.role === 'ADMIN') {
                    currentUserId.current = `ADMIN_${decoded.id?.toString()?.length === 24 ? '1' : decoded.id || '1'}`;
                } else {
                    currentUserId.current = decoded.Member_id || decoded.memberId || decoded.id || '';
                }
            }
        } catch (error) {
            console.error('Failed to decode token:', error);
        }
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (messages.length > prevMessagesLength.current && isNearBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        prevMessagesLength.current = messages.length;
    }, [messages]);

    // Dismiss mobile selection when tapping background
    const handleContainerTap = useCallback(() => {
        if (selectedMessage) clearSelection();
    }, [selectedMessage]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* ─── HEADER ─────────────────────────────────────── */}
            <ChatHeader position="static" elevation={0} sx={{ zIndex: 10 }}>
                {/* Mobile: action bar shown when a message is selected */}
                {isMobile && selectedMessage ? (
                    <Slide in={!!selectedMessage} direction="down">
                        <Toolbar sx={{ gap: 1, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                            {/* Close / deselect */}
                            <IconButton color="inherit" onClick={clearSelection} edge="start">
                                <Close />
                            </IconButton>

                            <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 600 }}>
                                1 selected
                            </Typography>

                            {/* Reply */}
                            <IconButton color="inherit" onClick={handleMobileReply} title="Reply">
                                <Reply size={22} />
                            </IconButton>

                            {/* Copy — only if there's text */}
                            {selectedMessage.text && (
                                <IconButton color="inherit" onClick={handleMobileCopy} title="Copy">
                                    <Copy size={22} />
                                </IconButton>
                            )}

                            {/* Delete — only for sent messages */}
                            {isSentMessage && (
                                <IconButton
                                    onClick={handleMobileDelete}
                                    title="Delete"
                                    sx={{ color: '#ff8a80' }}
                                >
                                    <Trash2 size={22} />
                                </IconButton>
                            )}
                        </Toolbar>
                    </Slide>
                ) : (
                    /* Normal header */
                    <Toolbar>
                        {onBack && (
                            <IconButton
                                edge="start"
                                color="inherit"
                                onClick={onBack}
                                sx={{ mr: 1, display: { lg: 'none' } }}
                            >
                                <ArrowBack />
                            </IconButton>
                        )}
                        <Avatar sx={{ background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)', mr: 2, position: 'relative' }}>
                            {recipientName.charAt(0).toUpperCase()}
                            {isRecipientOnline && (
                                <Circle sx={{ position: 'absolute', bottom: -2, right: -2, fontSize: 14, color: 'success.main', bgcolor: 'background.paper', borderRadius: '50%' }} />
                            )}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" noWrap>{recipientName}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {isTyping ? (
                                    <Typography variant="caption" color="primary" sx={{ fontWeight: 500 }}>Typing...</Typography>
                                ) : (
                                    <>
                                        {isRecipientOnline ? (
                                            <>
                                                <Circle sx={{ fontSize: 8, color: 'success.main' }} />
                                                <Typography variant="caption" color="text.secondary">Online</Typography>
                                            </>
                                        ) : (
                                            <>
                                                <WifiOff sx={{ fontSize: 12, color: 'text.secondary' }} />
                                                <Typography variant="caption" color="text.secondary">Offline</Typography>
                                            </>
                                        )}
                                    </>
                                )}
                                {recipientRole === 'admin' && (
                                    <Box component="span" sx={{ px: 1, py: 0.25, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 1, fontSize: '10px', fontWeight: 600 }}>Admin</Box>
                                )}
                            </Box>
                        </Box>
                    </Toolbar>
                )}
            </ChatHeader>

            {/* ─── MESSAGES ───────────────────────────────────── */}
            <MessagesContainer ref={containerRef} onClick={handleContainerTap}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
                        <CircularProgress size={40} />
                        <Typography variant="body2" color="text.secondary">Loading messages...</Typography>
                    </Box>
                ) : messages.length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
                        <Paper sx={{ width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)' }}>
                            <User size={40} color="#1976d2" />
                        </Paper>
                        <Typography variant="h6" color="text.primary">No messages yet</Typography>
                        <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400}>Start the conversation by sending a message below</Typography>
                    </Box>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <MessageBubble
                                key={message._id || `${message.roomId}-${index}`}
                                message={message}
                                isSent={message.senderId === currentUserId.current}
                                showTimestamp={true}
                                onDelete={onDeleteMessage}
                                onSelectMessage={isMobile ? handleSelectMessage : undefined}
                                isSelected={isMobile && selectedMessage?._id === message._id}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </MessagesContainer>

            {/* ─── INPUT ──────────────────────────────────────── */}
            <Box sx={{ bgcolor: 'background.paper', width: '100%', overflow: 'hidden' }}>
                <MessageInput
                    onSendMessage={onSendMessage}
                    onTyping={onTyping}
                    disabled={!isConnected}
                    placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
                />
            </Box>
        </Box>
    );
};

export default ChatWindow;
