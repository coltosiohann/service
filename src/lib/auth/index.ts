import { DrizzleAdapter } from '@auth/drizzle-adapter';
import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import nodemailer from 'nodemailer';

import { db } from '@/db';
import { env } from '@/lib/env';

import type { NextAuthOptions } from 'next-auth';

// Only create transporter if email config is provided
const transporter = env.EMAIL_SERVER_HOST
  ? nodemailer.createTransport({
      host: env.EMAIL_SERVER_HOST,
      port: env.EMAIL_SERVER_PORT,
      secure: env.EMAIL_SERVER_PORT === 465,
      auth: {
        user: env.EMAIL_SERVER_USER,
        pass: env.EMAIL_SERVER_PASSWORD,
      },
    })
  : null;

const authConfig: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  session: {
    strategy: 'database',
  },
  pages: {
    signIn: '/autentificare',
  },
  providers: [
    EmailProvider({
      from: env.EMAIL_FROM,
      maxAge: 60 * 60 * 24,
      async sendVerificationRequest({ identifier, url }) {
        if (!transporter) {
          console.log('Auth disabled - email not sent:', url);
          return;
        }

        const result = await transporter.sendMail({
          to: identifier,
          from: env.EMAIL_FROM,
          subject: 'Acces FleetCare',
          text: `Bună,\n\nAccesați linkul pentru a vă autentifica în FleetCare:\n${url}\n\nLinkul este valabil 24 de ore.`,
          html: `
            <p>Bună,</p>
            <p>Pentru a continua autentificarea în platforma <strong>FleetCare</strong>, faceți clic pe butonul de mai jos.</p>
            <p style="margin: 24px 0;">
              <a href="${url}" style="display:inline-block;background:#1d4ed8;color:#ffffff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;">
                Autentificare
              </a>
            </p>
            <p>Linkul este valabil 24 de ore. Dacă nu ați solicitat accesul, ignorați acest mesaj.</p>
          `,
        });

        if (result.rejected.length) {
          throw new Error(`E-mail respins pentru: ${result.rejected.join(', ')}`);
        }
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.name = user.name ?? null;
        session.user.email = user.email ?? null;
        session.user.image = user.image ?? null;
      }

      return session;
    },
  },
  secret: env.NEXTAUTH_SECRET,
};

const nextAuthResult = NextAuth(authConfig);

export const handlers = nextAuthResult.handlers;
export const signIn = nextAuthResult.signIn;
export const signOut = nextAuthResult.signOut;

/**
 * Auth function that always returns mock session (authentication disabled)
 */
export async function auth() {
  // Authentication disabled - always return mock session with OWNER permissions
  return {
    user: {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Utilizator',
      email: 'user@example.com',
      image: null,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}
