import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMessage, RoomView, ServerMessage } from "@burrower/shared";
import { getWebSocketUrl } from "../lib/api";

interface Options {
  roomCode: string;
  /** Read on every (re)connect so reconnects use the latest stored identity */
  getParams: () => Record<string, string> | null;
  onJoined?: (playerId: string, token: string) => void;
}

const RECONNECT_DELAY_MS = 1500;

/** One socket to the authoritative server; the latest RoomView is all the UI needs */
export function useRoom({ roomCode, getParams, onJoined }: Options) {
  const [view, setView] = useState<RoomView | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<number | null>(null);
  const errorTimer = useRef<number | null>(null);
  const getParamsRef = useRef(getParams);
  const onJoinedRef = useRef(onJoined);
  getParamsRef.current = getParams;
  onJoinedRef.current = onJoined;

  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = window.setTimeout(() => setError(null), 2500);
  }, []);

  const connect = useCallback(() => {
    const state = wsRef.current?.readyState;
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;
    if (retryRef.current) clearTimeout(retryRef.current);

    const params = getParamsRef.current();
    if (!params) return;

    const ws = new WebSocket(getWebSocketUrl(roomCode, params));
    let opened = false;

    ws.onopen = () => {
      opened = true;
      setIsConnected(true);
      setFailedAttempts(0);
    };
    ws.onclose = () => {
      if (wsRef.current !== ws) return;
      setIsConnected(false);
      if (!opened) setFailedAttempts((n) => n + 1);
      retryRef.current = window.setTimeout(() => {
        if (wsRef.current === ws) connect();
      }, RECONNECT_DELAY_MS);
    };
    ws.onmessage = (event) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data) as ServerMessage;
      } catch {
        return;
      }
      if (msg.type === "STATE") setView(msg.view);
      else if (msg.type === "JOINED") onJoinedRef.current?.(msg.playerId, msg.token);
      else if (msg.type === "ERROR") showError(msg.message);
    };
    wsRef.current = ws;
  }, [roomCode, showError]);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(msg));
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
      const ws = wsRef.current;
      wsRef.current = null;
      ws?.close();
    };
  }, [connect]);

  // Phones kill sockets in background tabs; reconnect as soon as we're visible
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && wsRef.current) connect();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
    window.addEventListener("online", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, [connect]);

  return { view, isConnected, failedAttempts, error, send };
}
