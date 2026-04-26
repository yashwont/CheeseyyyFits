import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export type ChatMessage = {
  id: number;
  roomUserId: number;
  senderId: number;
  senderUsername: string;
  senderRole: 'client' | 'support' | 'admin';
  message: string;
  isRead: boolean;
  createdAt: string;
};

type StockUpdate = { productId: number; stock: number };

type SocketCtx = {
  connected: boolean;
  stockUpdates: Record<number, number>;
  // Client
  myMessages: ChatMessage[];
  sendClientMessage: (message: string) => void;
  // Support/Admin
  newClientMessages: ChatMessage[];
  sendSupportMessage: (targetUserId: number, message: string) => void;
  watchUser: (userId: number) => void;
  unwatchUser: (userId: number) => void;
  clearNewClientMessages: () => void;
  reconnect: () => void;
};

const Ctx = createContext<SocketCtx>({
  connected: false,
  stockUpdates: {},
  myMessages: [],
  sendClientMessage: () => {},
  newClientMessages: [],
  sendSupportMessage: () => {},
  watchUser: () => {},
  unwatchUser: () => {},
  clearNewClientMessages: () => {},
  reconnect: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [stockUpdates, setStockUpdates] = useState<Record<number, number>>({});
  const [myMessages, setMyMessages] = useState<ChatMessage[]>([]);
  const [newClientMessages, setNewClientMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket'],
      auth: (cb) => cb({ token: localStorage.getItem('token') }),
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Real-time stock updates
    socket.on('stock_update', ({ productId, stock }: StockUpdate) => {
      setStockUpdates((prev) => ({ ...prev, [productId]: stock }));
    });

    // Client receives messages in their private room
    socket.on('new_message', (msg: ChatMessage) => {
      setMyMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Support receives new client messages across all rooms
    socket.on('new_client_message', (msg: ChatMessage) => {
      setNewClientMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Support: their own sent messages echoed back
    socket.on('support_sent', (msg: ChatMessage) => {
      setNewClientMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  const sendClientMessage = useCallback((message: string) => {
    socketRef.current?.emit('client_message', { message });
  }, []);

  const sendSupportMessage = useCallback((targetUserId: number, message: string) => {
    socketRef.current?.emit('support_message', { targetUserId, message });
  }, []);

  const watchUser = useCallback((userId: number) => {
    socketRef.current?.emit('watch_user', { userId });
  }, []);

  const unwatchUser = useCallback((userId: number) => {
    socketRef.current?.emit('unwatch_user', { userId });
  }, []);

  const clearNewClientMessages = useCallback(() => setNewClientMessages([]), []);

  const reconnect = useCallback(() => {
    socketRef.current?.disconnect().connect();
  }, []);

  return (
    <Ctx.Provider value={{
      connected, stockUpdates,
      myMessages, sendClientMessage,
      newClientMessages, sendSupportMessage,
      watchUser, unwatchUser, clearNewClientMessages, reconnect,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSocket = () => useContext(Ctx);
