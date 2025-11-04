import Ably from "ably";

const CHANNEL_PREFIX = "user:";

type AblyGlobals = typeof globalThis & {
  __ablyRest?: InstanceType<typeof Ably.Rest>;
};

const globalRealtime = globalThis as AblyGlobals;

const createRestClient = () => {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    throw new Error("ABLY_API_KEY is not configured.");
  }

  return new Ably.Rest(apiKey);
};

const getRestClient = () => {
  if (!globalRealtime.__ablyRest) {
    globalRealtime.__ablyRest = createRestClient();
  }
  return globalRealtime.__ablyRest;
};

export const publishToUser = async (userId: number, event: string, payload: unknown) => {
  if (!Number.isInteger(userId) || userId <= 0) {
    return;
  }

  try {
    const rest = getRestClient();
    const channel = rest.channels.get(`${CHANNEL_PREFIX}${userId}`);
    await channel.publish(event, payload);
  } catch (error) {
    if ((error as { code?: number }).code === 40140) {
      console.warn("Ably publish skipped: missing client capability", error);
      return;
    }
    console.error("Failed to publish realtime message", error);
  }
};

export const createUserTokenRequest = async (userId: number) => {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid user id for Ably token request.");
  }

  const rest = getRestClient();
  const capability = {
    [`${CHANNEL_PREFIX}${userId}`]: ["subscribe"],
  } satisfies Record<string, string[]>;

  return rest.auth.createTokenRequest({
    clientId: `${CHANNEL_PREFIX}${userId}`,
    capability: JSON.stringify(capability),
  });
};
