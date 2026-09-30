import * as jose from 'jose';
import { type NextRequest, NextResponse } from 'next/server';

import { addEvent } from '~/lib/activityFeed';
import { createSessionCookie } from '~/lib/auth/session';
import { prisma } from '~/lib/db';
import { env } from '~/env';

/**
 * SSO Callback Route
 *
 * Handles JWT-based authentication from Rivulent.
 * Flow:
 * 1. Rivulent generates a signed JWT with user info
 * 2. User is redirected here with ?token=<jwt>
 * 3. We verify the JWT, find/create the user, create a session
 * 4. User is redirected to the dashboard (or specified redirect)
 */

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const redirectTo = request.nextUrl.searchParams.get('redirect') ?? '/dashboard';

  if (!token) {
    return NextResponse.redirect(
      new URL('/signin?error=missing_token', request.url),
    );
  }

  const secret = env.SSO_TOKEN_SECRET;

  if (!secret) {
    return NextResponse.redirect(
      new URL('/signin?error=sso_not_configured', request.url),
    );
  }

  try {
    // 1. Verify JWT signature and expiry
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, secretKey, {
      maxTokenAge: '120s', // Allow some clock skew
    });

    // 2. Validate required claims
    const { sub, name, nonce } = payload as {
      sub?: string;
      name?: string;
      nonce?: string;
    };

    if (!sub || !nonce) {
      return NextResponse.redirect(
        new URL('/signin?error=invalid_token', request.url),
      );
    }

    // 3. Check nonce hasn't been used (prevent replay attacks)
    const existingNonce = await prisma.usedNonce.findUnique({
      where: { nonce },
    });

    if (existingNonce) {
      return NextResponse.redirect(
        new URL('/signin?error=token_already_used', request.url),
      );
    }

    // Mark nonce as used (expires in 5 minutes for cleanup)
    await prisma.usedNonce.create({
      data: {
        nonce,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // Probabilistic cleanup of expired nonces (5% chance)
    if (Math.random() < 0.05) {
      void prisma.usedNonce.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
    }

    // 4. Find or create user by network ID
    let user = await prisma.user.findFirst({
      where: { networkId: sub },
    });

    if (!user) {
      // Create new user linked to Rivulent
      // Username derived from name or sub ID
      const username = name ?? `user_${sub}`;

      // Check if username exists, append random suffix if needed
      const existingUsername = await prisma.user.findFirst({
        where: { username },
      });

      const finalUsername = existingUsername
        ? `${username}_${sub.slice(-6)}`
        : username;

      user = await prisma.user.create({
        data: {
          username: finalUsername,
          networkId: sub,
        },
      });

      void addEvent('User Created', `SSO user ${finalUsername} created via Rivulent`);
    }

    // 5. Create session (SSO users bypass 2FA - Rivulent is trusted)
    await createSessionCookie(user.id);

    // 6. Log the SSO login
    void addEvent('SSO Login', `User ${user.username} logged in via SSO`);

    // 7. Redirect to requested page or dashboard
    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('SSO callback error:', error);

    if (error instanceof jose.errors.JWTExpired) {
      return NextResponse.redirect(
        new URL('/signin?error=token_expired', request.url),
      );
    }

    return NextResponse.redirect(
      new URL('/signin?error=invalid_token', request.url),
    );
  }
}
