"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Server actions for contact form
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export async function submitContactForm(data: ContactFormData) {
  try {
    // Validate the data
    const validatedData = contactSchema.parse(data);

    // Save to database
    await prisma.contactMessage.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject,
        message: validatedData.message,
      },
    });

    return { success: true, message: "Your message has been sent successfully!" };
  } catch (error) {
    console.error("Contact form submission error:", error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        message: error.issues[0].message 
      };
    }

    return { 
      success: false, 
      message: "Failed to send message. Please try again later." 
    };
  }
}

export async function getContactMessages() {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });

    return messages;
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    throw new Error("Failed to fetch contact messages");
  }
}

export async function updateContactMessageStatus(id: number, status: string, adminNotes?: string) {
  try {
    await prisma.contactMessage.update({
      where: { id },
      data: { 
        status,
        ...(adminNotes && { adminNotes }),
      },
    });

    return { success: true, message: "Status updated successfully" };
  } catch (error) {
    console.error("Error updating contact message:", error);
    return { success: false, message: "Failed to update status" };
  }
}
