import NextAuth from 'next-auth';

// Minimal auth configuration for when authentication is disabled
// This prevents client-side errors while SessionProvider is still in use
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [],
  pages: {
    signIn: '/autentificare',
  },
  callbacks: {
    async session({ session }) {
      // Return empty session since auth is disabled
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-key',
});
