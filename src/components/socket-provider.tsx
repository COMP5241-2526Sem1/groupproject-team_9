'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
})

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
    console.log('🔌 Initializing Socket.io connection to:', socketUrl)
    
    const socketInstance = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      withCredentials: true,
      transports: ['polling', 'websocket']
    })

    // Set socket immediately
    setSocket(socketInstance)

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id)
      setIsConnected(true)
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error)
      setIsConnected(false)
    })

    // Check initial connection state
    if (socketInstance.connected) {
      console.log('✅ Socket already connected on initialization')
      setIsConnected(true)
    }

    return () => {
      console.log('🔌 Cleaning up Socket.io connection')
      socketInstance.close()
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
