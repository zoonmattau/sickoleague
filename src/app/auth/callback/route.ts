import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error_description") || searchParams.get("error");
  const next = searchParams.get("next") ?? "/dashboard";

  console.log("[Auth Callback] Starting with code:", code ? "present" : "missing");

  if (errorParam) {
    console.log("[Auth Callback] Error param:", errorParam);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorParam)}`);
  }

  if (code) {
    try {
      const redirectUrl = `${origin}${next}`;
      let response = NextResponse.redirect(redirectUrl);

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                console.log("[Auth Callback] Setting cookie:", name);
                response.cookies.set(name, value, {
                  ...options,
                  // Ensure cookies work in production
                  secure: process.env.NODE_ENV === "production",
                  sameSite: "lax",
                  path: "/",
                });
              });
            },
          },
        }
      );

      console.log("[Auth Callback] Exchanging code for session...");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.log("[Auth Callback] Exchange error:", error.message);
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(error.message || "unknown")}`
        );
      }

      console.log("[Auth Callback] Session obtained, user:", data.user?.email);

      // The exchangeCodeForSession should have triggered setAll
      // but let's also explicitly set the session to be sure
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      // Create or update Coach record for the user
      if (data.user) {
        const discordId = data.user.user_metadata?.provider_id || data.user.id;
        const displayName = data.user.user_metadata?.full_name ||
                           data.user.user_metadata?.name ||
                           data.user.user_metadata?.preferred_username ||
                           data.user.email?.split("@")[0] ||
                           "Unknown";
        const avatarUrl = data.user.user_metadata?.avatar_url || null;
        const email = data.user.email || "";

        console.log("[Auth Callback] Creating/updating coach:", displayName);

        // First check if a coach exists with this discordId or email
        const existingCoach = await prisma.coach.findFirst({
          where: {
            OR: [
              { discordId },
              { email },
            ],
          },
        });

        if (existingCoach) {
          // Update existing coach, linking discordId if it changed
          await prisma.coach.update({
            where: { id: existingCoach.id },
            data: {
              discordId,
              displayName,
              email,
              avatarUrl,
            },
          });
        } else {
          // Create new coach
          await prisma.coach.create({
            data: {
              discordId,
              displayName,
              email,
              avatarUrl,
            },
          });
        }
      }

      console.log("[Auth Callback] Redirecting to:", redirectUrl);
      return response;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "unexpected_exception";
      console.log("[Auth Callback] Exception:", msg);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`);
    }
  }

  console.log("[Auth Callback] No code provided");
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
