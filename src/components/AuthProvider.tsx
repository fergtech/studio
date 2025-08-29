'use client';

import { ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';
// import { io, Socket } from 'socket.io-client'; // Temporarily disabled for Vercel deployment

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { data: session } = useSession();

  useEffect(() => {
    // Socket connection temporarily disabled for Vercel deployment
    // TODO: Re-enable user room joining after implementing polling system
    // if (!session?.user?.id) return;
    // const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:9003';
    // const socket: Socket = io(SOCKET_URL, {
    //   path: '/api/socketio',
    //   transports: ['websocket', 'polling'],
    // });
    // socket.on('connect', () => {
    //   socket.emit('joinUserRoom', session.user.id);
    // });
    // socket.on('reconnect', () => {
    //   socket.emit('joinUserRoom', session.user.id);
    // });
    // return () => {
    //   socket.disconnect();
    // };
  }, [session?.user?.id]);

  return <>{children}</>;
}
