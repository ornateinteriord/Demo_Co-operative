import { io, Socket } from 'socket.io-client';
import TokenService from '../api/token/tokenService';

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
    if (socket && socket.connected) {
        return socket;
    }

    const token = TokenService.getToken();
    const memberId = TokenService.getMemberId();
    const apiUrl = import.meta.env.VITE_MLM_API_URL || 'http://localhost:5000';

    socket = io(apiUrl, {
        auth: { token },
        query: { userId: memberId }, // backend matches this to activeUsers map
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
    });

    // Connection event handlers
    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('🔴 Socket connection error:', error.message);
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
    });

    return socket;
};

export const getSocket = (): Socket | null => {
    return socket;
};

export const disconnectSocket = (): void => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('🔌 Socket manually disconnected');
    }
};
