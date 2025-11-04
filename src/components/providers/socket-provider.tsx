"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Ably from "ably";

type MessageHandler<Payload = unknown> = (payload: Payload) => void;

type SocketLike = {
  on: <Payload = unknown>(event: string, handler: MessageHandler<Payload>) => void;
  off: <Payload = unknown>(event: string, handler: MessageHandler<Payload>) => void;
};

const SocketContext = createContext<SocketLike | null>(null);

const CHANNEL_PREFIX = "user:";
type AblyModule = {
  Realtime: new (options: Record<string, unknown>) => AblyRealtimeClient;
};

type AblyRealtimeClient = {
  channels: {
    get: (name: string) => AblyRealtimeChannel;
  };
  connection: {
    on: (event: string, listener: (eventData: unknown) => void) => void;
  };
  close: () => void | Promise<void>;
};

type AblyRealtimeChannel = {
  subscribe: (event: string, listener: AblyMessageCallback) => void | Promise<void>;
  unsubscribe: (event: string, listener: AblyMessageCallback) => void | Promise<void>;
  detach: () => void | Promise<void>;
};

type AblyMessage = {
  data: unknown;
};

type AblyMessageCallback = (message: AblyMessage) => void;

export function SocketProvider({ userId, children }: { userId: number | null; children: ReactNode }) {
  const [socket, setSocket] = useState<SocketLike | null>(null);
  const handlersRef = useRef<Map<string, Map<MessageHandler<any>, AblyMessageCallback>>>(new Map());
  const channelRef = useRef<AblyRealtimeChannel | null>(null);
  const clientRef = useRef<AblyRealtimeClient | null>(null);

  useEffect(() => {
    if (!userId || userId <= 0) {
      const channel = channelRef.current;
      if (channel) {
        handlersRef.current.forEach((map, event) => {
          map.forEach((wrapped) => {
            try {
              const result = channel.unsubscribe(event, wrapped);
              if (result instanceof Promise) {
                void result.catch((error) => {
                  console.error("Ably unsubscribe error", error);
                });
              }
            } catch (error) {
              console.error("Ably unsubscribe error", error);
            }
          });
        });
        handlersRef.current.clear();
        try {
          const detachResult = channel.detach();
          if (detachResult instanceof Promise) {
            void detachResult.catch(() => null);
          }
        } catch (error) {
          console.error("Ably channel detach error", error);
        }
        channelRef.current = null;
      } else {
        handlersRef.current.clear();
      }

      if (clientRef.current) {
        try {
          const closeResult = clientRef.current.close();
          if (closeResult instanceof Promise) {
            void closeResult.catch(() => null);
          }
        } catch (error) {
          console.error("Ably realtime close error", error);
        }
        clientRef.current = null;
      }

      setSocket(null);
      return;
    }

    let isMounted = true;
    const { Realtime } = Ably as unknown as AblyModule;
    const realtime = new Realtime({
      authUrl: "/api/ably/token",
    });

    clientRef.current = realtime;

    realtime.connection.on("failed", (error: unknown) => {
      console.error("Ably realtime connection failed", error);
    });

    realtime.connection.on("disconnected", () => {
      // Ably will attempt automatic reconnect; we just log for awareness.
      console.warn("Ably realtime connection disconnected");
    });

    const channel = realtime.channels.get(`${CHANNEL_PREFIX}${userId}`);
    channelRef.current = channel;

    const cleanupChannel = () => {
      const handlers = handlersRef.current;
      handlers.forEach((map, event) => {
        map.forEach((wrapped) => {
          try {
            const result = channel.unsubscribe(event, wrapped);
            if (result instanceof Promise) {
              void result.catch((error) => {
                console.error("Ably unsubscribe error", error);
              });
            }
          } catch (error) {
            console.error("Ably unsubscribe error", error);
          }
        });
      });
      handlers.clear();
    };

    const socketLike: SocketLike = {
      on: <Payload = unknown>(event: string, handler: MessageHandler<Payload>) => {
        const wrapped: AblyMessageCallback = (message) => {
          handler(message.data as Payload);
        };

        const eventHandlers = handlersRef.current.get(event) ?? new Map<MessageHandler<any>, AblyMessageCallback>();
        eventHandlers.set(handler, wrapped);
        handlersRef.current.set(event, eventHandlers);

        try {
          const result = channel.subscribe(event, wrapped);
          if (result instanceof Promise) {
            void result.catch((error: unknown) => {
              console.error("Ably subscribe error", error);
            });
          }
        } catch (error) {
          console.error("Ably subscribe error", error);
        }
      },
      off: <Payload = unknown>(event: string, handler: MessageHandler<Payload>) => {
        const eventHandlers = handlersRef.current.get(event);
        if (!eventHandlers) {
          return;
        }

        const wrapped = eventHandlers.get(handler);
        if (!wrapped) {
          return;
        }

        try {
          const result = channel.unsubscribe(event, wrapped);
          if (result instanceof Promise) {
            void result.catch((error: unknown) => {
              console.error("Ably unsubscribe error", error);
            });
          }
        } catch (error) {
          console.error("Ably unsubscribe error", error);
        }
        eventHandlers.delete(handler);
        if (eventHandlers.size === 0) {
          handlersRef.current.delete(event);
        }
      },
    };

    if (isMounted) {
      setSocket(socketLike);
    }

    return () => {
      isMounted = false;
      cleanupChannel();
      try {
        const detachResult = channel.detach();
        if (detachResult instanceof Promise) {
          void detachResult.catch(() => null);
        }
      } catch (error) {
        console.error("Ably channel detach error", error);
      }
      if (clientRef.current) {
        try {
          const closeResult = clientRef.current.close();
          if (closeResult instanceof Promise) {
            void closeResult.catch(() => null);
          }
        } catch (error) {
          console.error("Ably realtime close error", error);
        }
      }
      channelRef.current = null;
      clientRef.current = null;
      setSocket(null);
    };
  }, [userId]);

  const contextValue = useMemo(() => socket, [socket]);

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
