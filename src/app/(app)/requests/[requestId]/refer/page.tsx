import { notFound, redirect } from "next/navigation";
import { auth, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReferDonorForm from "@/components/requests/refer-donor-form";

interface ReferDonorPageProps {
  params: Promise<{
    requestId: string;
  }>;
}

export default async function ReferDonorPage({ params }: ReferDonorPageProps) {
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
    },
  });

  if (!request) {
    notFound();
  }

  // Can't refer for closed/fulfilled requests
  if (request.status === "Fulfilled" || request.status === "Closed") {
    redirect(`/requests/${id}`);
  }

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Refer a Donor</h1>
        <p className="text-muted-foreground mt-2">
          Help {request.patientName} by referring a {request.bloodGroup} blood donor
        </p>
      </div>

      <div className="bg-surface-card rounded-2xl p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-3">Request Details</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Blood Group:</span>
            <span className="ml-2 font-medium text-foreground">{request.bloodGroup}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Amount:</span>
            <span className="ml-2 font-medium text-foreground">{request.amountNeeded.toString()} bags</span>
          </div>
          <div>
            <span className="text-muted-foreground">Hospital:</span>
            <span className="ml-2 font-medium text-foreground">{request.hospitalName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Required Date:</span>
            <span className="ml-2 font-medium text-foreground">
              {new Date(request.requiredDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <ReferDonorForm requestId={id} requestUserId={request.userId} />
    </div>
  );
}
