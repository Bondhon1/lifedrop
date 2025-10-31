export type ActionState<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; message: string; issues?: string[] };

export const success = <T>(data: T): ActionState<T> => ({ ok: true, data });

export const failure = (message: string, issues?: string[]): ActionState<never> => ({
  ok: false,
  message,
  ...(issues ? { issues } : {}),
});
