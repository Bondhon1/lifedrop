import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() ?? '';
    if (!q) {
      return NextResponse.json({ users: [], requests: [] });
    }

    const take = 6;
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, username: true, name: true, profilePicture: true, donorApplication: { select: { status: true } } },
      take,
    });

    const requests = await prisma.bloodRequest.findMany({
      where: {
        OR: [
          { patientName: { contains: q, mode: 'insensitive' } },
          { hospitalName: { contains: q, mode: 'insensitive' } },
          { reason: { contains: q, mode: 'insensitive' } },
          { user: { is: { username: { contains: q, mode: 'insensitive' } } } },
          { user: { is: { name: { contains: q, mode: 'insensitive' } } } },
        ],
      },
      select: { id: true, patientName: true, hospitalName: true, bloodGroup: true, user: { select: { id: true, username: true, name: true } } },
      take,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users, requests });
  } catch (err) {
    console.error('Search API error', err);
    return NextResponse.json({ users: [], requests: [] }, { status: 500 });
  }
}
