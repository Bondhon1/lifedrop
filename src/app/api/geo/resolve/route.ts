import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type ResolveRequestBody = {
  latitude?: number;
  longitude?: number;
  address?: {
    state?: string;
    district?: string;
    upazila?: string;
  };
};

type LocationMatch = {
  divisionId: number | null;
  districtId: number | null;
  upazilaId: number | null;
};

const normalise = (value?: string | null) => value?.toLowerCase().trim() ?? null;

export async function POST(request: Request) {
  let payload: ResolveRequestBody | null = null;

  try {
    payload = (await request.json()) as ResolveRequestBody;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const latitude = typeof payload?.latitude === "number" ? payload.latitude : Number(payload?.latitude);
  const longitude = typeof payload?.longitude === "number" ? payload.longitude : Number(payload?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 });
  }

  const match: LocationMatch = {
    divisionId: null,
    districtId: null,
    upazilaId: null,
  };

  const stateHint = normalise(payload?.address?.state);
  const districtHint = normalise(payload?.address?.district);
  const upazilaHint = normalise(payload?.address?.upazila);

  if (stateHint) {
    const division = await prisma.divisions.findFirst({
      where: { name: { contains: stateHint, mode: "insensitive" } },
      select: { id: true },
    });
    match.divisionId = division?.id ?? null;
  }

  if (districtHint) {
    const district = await prisma.districts.findFirst({
      where: {
        name: { contains: districtHint, mode: "insensitive" },
        ...(match.divisionId ? { divisionId: match.divisionId } : {}),
      },
      select: { id: true, divisionId: true },
    });

    if (district) {
      match.districtId = district.id;
      match.divisionId = match.divisionId ?? district.divisionId;
    }
  }

  if (upazilaHint) {
    const upazila = await prisma.upazilas.findFirst({
      where: {
        name: { contains: upazilaHint, mode: "insensitive" },
        ...(match.districtId ? { districtId: match.districtId } : {}),
      },
      select: {
        id: true,
        districtId: true,
        district: { select: { divisionId: true } },
      },
    });

    if (upazila) {
      match.upazilaId = upazila.id;
      match.districtId = match.districtId ?? upazila.districtId;
      match.divisionId = match.divisionId ?? upazila.district.divisionId;
    }
  }

  if (!match.upazilaId || !match.districtId || !match.divisionId) {
    const upazilas = await prisma.upazilas.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        districtId: true,
        district: { select: { divisionId: true } },
      },
    });

    type Candidate = (typeof upazilas)[number];

    const best = upazilas.reduce<{ candidate: Candidate | null; distance: number }>(
      (closest, candidate) => {
        if (candidate.latitude === null || candidate.longitude === null) {
          return closest;
        }

        const latDiff = candidate.latitude - latitude;
        const lonDiff = candidate.longitude - longitude;
        const distance = latDiff * latDiff + lonDiff * lonDiff;

        if (!closest.candidate || distance < closest.distance) {
          return { candidate, distance };
        }

        return closest;
      },
      { candidate: null, distance: Number.POSITIVE_INFINITY },
    );

    if (best.candidate) {
      match.upazilaId = match.upazilaId ?? best.candidate.id;
      match.districtId = match.districtId ?? best.candidate.districtId;
      match.divisionId = match.divisionId ?? best.candidate.district.divisionId;
    }
  }

  return NextResponse.json(match satisfies LocationMatch);
}
