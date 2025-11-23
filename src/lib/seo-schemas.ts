export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Lifedrop",
    description: "Blood donation coordination platform connecting patients with donors",
    url: process.env.NEXTAUTH_URL || "https://www.lifedrop.live/",
    logo: `${process.env.NEXTAUTH_URL || "https://www.lifedrop.live/"}/logo.png`,
    sameAs: [
      // Add your social media URLs when available
      // "https://www.facebook.com/lifedrop",
      // "https://twitter.com/lifedrop",
      // "https://www.instagram.com/lifedrop",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      availableLanguage: ["English"],
    },
  };
}

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Lifedrop",
    description: "Blood donation coordination platform",
    url: process.env.NEXTAUTH_URL || "https://www.lifedrop.live/",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXTAUTH_URL || "https://www.lifedrop.live/"}/feed?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateMedicalWebPageSchema(pageData: {
  title: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: pageData.title,
    description: pageData.description,
    url: pageData.url,
    lastReviewed: new Date().toISOString(),
    specialty: {
      "@type": "MedicalSpecialty",
      name: "Hematology",
    },
  };
}

export function generateBloodDonationEventSchema(request: {
  id: number;
  patientName: string;
  bloodGroup: string;
  hospitalName: string;
  location: string;
  requiredDate: string;
  urgencyStatus: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `Blood Donation Needed: ${request.bloodGroup} for ${request.patientName}`,
    description: `Urgent blood donation request for ${request.patientName} at ${request.hospitalName}`,
    startDate: request.requiredDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: request.hospitalName,
      address: request.location,
    },
    organizer: {
      "@type": "Organization",
      name: "Lifedrop",
      url: process.env.NEXTAUTH_URL || "https://www.lifedrop.live/",
    },
  };
}
