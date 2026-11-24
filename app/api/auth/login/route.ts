/**
 * POST /api/auth/login
 * Authenticates Super Admin, Restaurant Admin, or Kitchen Staff.
 * Returns a redirect URL based on role and restaurant slug.
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email or password format" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { restaurant: { select: { slug: true, isActive: true } } },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Restaurant users must belong to an active restaurant
    if (user.role !== "SUPER_ADMIN") {
      if (!user.restaurant || !user.restaurant.isActive) {
        return NextResponse.json(
          { error: "Restaurant is inactive or not found" },
          { status: 403 }
        );
      }
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      restaurantId: user.restaurantId,
      restaurantSlug: user.restaurant?.slug ?? null,
    };

    // Determine redirect URL by role
    let redirectTo: string;
    if (user.role === "SUPER_ADMIN") {
      redirectTo = "/super-admin";
    } else if (user.role === "RESTAURANT_ADMIN") {
      redirectTo = `/${user.restaurant!.slug}/admin`;
    } else if (user.role === "KITCHEN_STAFF") {
      redirectTo = `/${user.restaurant!.slug}/kitchen`;
    } else {
      redirectTo = "/";
    }

    const response = NextResponse.json({ ok: true, redirectTo });
    return setSessionCookie(response, sessionPayload);
  } catch (err) {
    console.error("[/api/auth/login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
