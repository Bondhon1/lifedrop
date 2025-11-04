import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({
    message: "Socket.IO has been removed. Realtime features now use Ably.",
  });
}
