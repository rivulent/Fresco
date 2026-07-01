import * as jose from 'jose';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '~/env';
import { prisma } from '~/lib/db';
import { auth } from '~/utils/auth';

// In-memory nonce tracking (use Redis in production for multi-instance deployments)
const usedNonces = new Map<string, number>();

// Clean up expired nonces periodically
function cleanupNonces() {
  const now = Date.now();
  for (const [nonce, expiry] of usedNonces.entries()) {
    if (expiry < now) {
      usedNonces.delete(nonce);
    }
  }
}

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
      email?: string;
      nonce?: string;
    };

    if (!sub || !nonce) {
      return NextResponse.redirect(
        new URL('/signin?error=invalid_token', request.url),
      );
    }

    // 3. Check nonce hasn't been used (prevent replay attacks)
    cleanupNonces();
    if (usedNonces.has(nonce)) {
      return NextResponse.redirect(
        new URL('/signin?error=token_already_used', request.url),
      );
    }
    // Mark nonce as used with expiry time
    usedNonces.set(nonce, Date.now() + 5 * 60 * 1000);

    // 4. Find or create user by network ID
    let user = await prisma.user.findFirst({
      where: { networkId: sub },
    });

    if (!user) {
      // Create new user linked to Network
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
    }

    // 5. Create Lucia session
    const session = await auth.createSession({
      userId: user.id,
      attributes: {},
    });

    // 6. Set session cookie
    const sessionCookie = auth.createSessionCookie(session);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

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
