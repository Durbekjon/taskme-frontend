/**
 * useSocket — real-time WebSocket connection for the web dashboard.
 *
 * Connects once on mount (after token is available), disconnects on unmount.
 * Returns helpers to subscribe to `notification` and `assignment_updated`
 * events, and a count of unread in-app notifications.
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getToken } from '../session';

export interface NotificationEvent {
  id?: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string | null;
  createdAt?: string;
}

export interface AssignmentUpdatedEvent {
  bookingId: string;
  assignmentId: string;
  status: string;
}

type EventMap = {
  notification: NotificationEvent;
  assignment_updated: AssignmentUpdatedEvent;
};

type Listener<T> = (data: T) => void;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);

  const listenersRef = useRef<Map<string, Set<Listener<unknown>>>>(new Map());

  const emitInternal = useCallback((event: string, data: unknown) => {
    const fns = listenersRef.current.get(event);
    if (fns) for (const fn of fns) fn(data);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const wsUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(
      /\/api\/?$/,
      '',
    );

    const socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('notification', (data: NotificationEvent) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((n) => n + 1);
      emitInternal('notification', data);
    });

    socket.on('assignment_updated', (data: AssignmentUpdatedEvent) => {
      emitInternal('assignment_updated', data);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const on = useCallback(
    <K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>) => {
      const map = listenersRef.current;
      if (!map.has(event)) map.set(event, new Set());
      (map.get(event) as Set<Listener<unknown>>).add(listener as Listener<unknown>);
      return () => {
        (map.get(event) as Set<Listener<unknown>>)?.delete(listener as Listener<unknown>);
      };
    },
    [],
  );

  const markAllRead = useCallback(() => setUnreadCount(0), []);

  return { connected, on, unreadCount, notifications, markAllRead };
}
