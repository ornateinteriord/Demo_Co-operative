import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket } from '../utils/socket';
import { Socket } from 'socket.io-client';
import { post, get, del } from '../api/Api';
import { toast } from 'react-toastify';

export interface Message {
    _id?: string;
    roomId: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    messageType?: 'text' | 'image' | 'file' | 'audio';
    text: string;
    imageUrl?: string;
    fileName?: string;
    fileSize?: number;
    isRead: boolean;
    createdAt: Date | string;
}

export interface ChatRoom {
    _id?: string;
    roomId: string;
    participants: string[];
    participantDetails: Array<{
        memberId: string;
        name: string;
        role: string;
        profileImage?: string;
    }>;
    lastMessage?: string;
    lastMessageTime?: Date | string;
    unreadCount?: number;
}

export const useChatSocket = (roomId?: string, recipientId?: string) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [recipientOnline, setRecipientOnline] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const pollingRef = useRef<NodeJS.Timeout>();

    // Try socket connection but don't rely on it
    useEffect(() => {
        socketRef.current = getSocket();

        if (!socketRef.current) {
            console.log('Socket not initialized, using REST API only');
            return;
        }

        const socket = socketRef.current;

        // Connection status - but we always show connected since REST works
        const handleConnect = () => {
            console.log('Socket connected');
            setIsConnected(true);
            
            // Check recipient status on connect
            if (recipientId) {
                socket.emit('checkUserStatus', { userId: recipientId }, (response: { isOnline: boolean }) => {
                    setRecipientOnline(response.isOnline);
                });
            }
        };
        const handleDisconnect = () => {
            console.log('Socket disconnected, using REST API');
            setIsConnected(false);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        
        // Listen for user status updates
        const handleUserStatus = (data: { userId: string, status: 'online' | 'offline' }) => {
            if (data.userId === recipientId) {
                setRecipientOnline(data.status === 'online');
            }
        };
        socket.on('userStatus', handleUserStatus);
        
        // Listen for message deletion
        const handleMessageDeleted = (data: { messageId: string, roomId: string }) => {
            if (data.roomId === roomId) {
                setMessages(prev => prev.filter(m => m._id !== data.messageId));
            }
        };
        socket.on('messageDeleted', handleMessageDeleted);

        // Join room if roomId is provided and socket is connected
        if (roomId && socket.connected) {
            socket.emit('joinRoom', { roomId });

            // Listen for new messages (as backup to polling)
            const handleReceiveMessage = (message: Message) => {
                setMessages((prev) => {
                    // Avoid duplicates
                    if (prev.some(m => m._id === message._id)) {
                        return prev;
                    }
                    return [...prev, message];
                });
            };

            // Listen for typing indicator
            const handleUserTyping = (data: { userId: string; isTyping: boolean }) => {
                setIsTyping(data.isTyping);
            };

            socket.on('receiveMessage', handleReceiveMessage);
            socket.on('userTyping', handleUserTyping);

            return () => {
                socket.off('receiveMessage', handleReceiveMessage);
                socket.off('userTyping', handleUserTyping);
                socket.off('userStatus', handleUserStatus);
                socket.off('messageDeleted', handleMessageDeleted);
                socket.off('connect', handleConnect);
                socket.off('disconnect', handleDisconnect);
            };
        }

        return () => {
            socket.off('userStatus', handleUserStatus);
            socket.off('messageDeleted', handleMessageDeleted);
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
        };
    }, [roomId, recipientId]);

    // Polling for new messages (works even when socket fails on Vercel)
    useEffect(() => {
        if (!roomId) return;

        const pollMessages = async () => {
            try {
                const response = await get(`/chat/messages/${roomId}`);
                if (response.success && response.data) {
                    setMessages(response.data);
                }
            } catch (error) {
                console.error('Failed to poll messages:', error);
            }
        };

        // Poll every 3 seconds for new messages
        pollingRef.current = setInterval(pollMessages, 3000);

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, [roomId]);

    // Send message using REST API (supports text, image, and file messages)
    const sendMessage = useCallback(
        async (text: string, attachment?: { imageUrl: string; messageType: string; fileName: string; fileSize: number }) => {
            if (!roomId || (!text.trim() && !attachment) || isSending) return;

            setIsSending(true);
            try {
                const response = await post('/chat/message/send', {
                    roomId,
                    text: text.trim(),
                    imageUrl: attachment?.imageUrl || '',
                    messageType: attachment?.messageType || 'text',
                    fileName: attachment?.fileName || '',
                    fileSize: attachment?.fileSize || 0,
                });

                if (response.success && response.data) {
                    // Add message to local state immediately
                    setMessages((prev) => {
                        // Avoid duplicates
                        if (prev.some(m => m._id === response.data._id)) {
                            return prev;
                        }
                        return [...prev, response.data];
                    });
                }
            } catch (error) {
                console.error('Failed to send message:', error);
                toast.error('Failed to send message. Please try again.', {
                    position: "top-center"
                });
            } finally {
                setIsSending(false);
            }
        },
        [roomId, isSending]
    );

    const sendTypingIndicator = useCallback(
        (typing: boolean) => {
            if (!socketRef.current || !roomId || !socketRef.current.connected) return;

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            socketRef.current.emit('typing', { roomId, isTyping: typing });

            // Auto-stop typing after 3 seconds
            if (typing) {
                typingTimeoutRef.current = setTimeout(() => {
                    socketRef.current?.emit('typing', { roomId, isTyping: false });
                }, 3000);
            }
        },
        [roomId]
    );

    const markAsRead = useCallback(
        (messageIds: string[]) => {
            if (!socketRef.current || !roomId || !socketRef.current.connected) return;

            socketRef.current.emit('markAsRead', { roomId, messageIds });
        },
        [roomId]
    );

    const deleteMessage = useCallback(
        async (messageId: string) => {
            try {
                const response = await del(`/chat/message/${messageId}`);
                if (response.success) {
                    setMessages((prev) => prev.filter(m => m._id !== messageId));
                    toast.success('Message deleted');
                }
            } catch (error) {
                console.error('Failed to delete message:', error);
                toast.error('Failed to delete message');
            }
        },
        [roomId]
    );

    return {
        messages,
        setMessages,
        isConnected,
        recipientOnline,
        isTyping,
        isSending,
        sendMessage,
        sendTypingIndicator,
        markAsRead,
        deleteMessage,
    };
};
