/*
 * @deprecated This module previously exposed Socket.IO helpers. It now bridges to the Ably-based implementation
 * to avoid breaking imports that haven’t been updated yet. Prefer importing from '@/lib/realtime'.
 */

import { publishToUser } from "./realtime";

export const setIOServer = () => {
  console.warn("setIOServer is deprecated. Socket.IO support has been removed.");
};

export const registerSocket = () => {
  console.warn("registerSocket is deprecated. Socket.IO support has been removed.");
};

export const unregisterSocket = () => {
  console.warn("unregisterSocket is deprecated. Socket.IO support has been removed.");
};

export const emitToUser = (userId: number, event: string, payload: unknown) => {
  void publishToUser(userId, event, payload);
};
