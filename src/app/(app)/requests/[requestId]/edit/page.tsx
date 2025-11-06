import { notFound, redirect } from "next/navigation";
import { auth, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EditBloodRequestForm from "@/components/requests/edit-blood-request-form";

interface EditRequestPageProps {
  params: Promise<{
    requestId: string;
  }>;
}

export default async function EditRequestPage({ params }: EditRequestPageProps) {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  const userId = sessionUser?.id ? Number(sessionUser.id) : null;
  
  if (!userId) {
    redirect("/login");
  }

  const { requestId } = await params;
  const id = parseInt(requestId, 10);

  if (isNaN(id)) {
    notFound();
  }

  const request = await prisma.bloodRequest.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      division: true,
      district: true,
      upazila: true,
    },
  });

  if (!request) {
    notFound();
  }

  // Only the owner can edit
  if (request.userId !== userId) {
    redirect(`/requests/${id}`);
  }

  // Can't edit fulfilled or closed requests
  if (request.status === "Fulfilled" || request.status === "Closed") {
    redirect(`/requests/${id}`);
  }

  // Convert Decimal to number for Client Component
  const requestData = {
    ...request,
    amountNeeded: Number(request.amountNeeded),
    latitude: request.latitude ? Number(request.latitude) : null,
    longitude: request.longitude ? Number(request.longitude) : null,
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Edit Blood Request</h1>
        <p className="text-muted-foreground mt-2">
          Update the details for {requestData.patientName}&apos;s blood request
        </p>
      </div>

      <EditBloodRequestForm request={requestData} />
    </div>
  );
}
