import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

if (!process.env.NEXTAUTH_SECRET) {
  console.error("❌ NEXTAUTH_SECRET is not set");
}
if (!process.env.GOOGLE_CLIENT_ID) {
  console.error("❌ GOOGLE_CLIENT_ID is not set");
}

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  logger: {
    error(code, ...args) {
      console.error("[NextAuth ERROR]", code, JSON.stringify(args));
    },
    warn(code, ...args) {
      console.warn("[NextAuth WARN]", code, JSON.stringify(args));
    },
    debug(code, ...args) {
      console.log("[NextAuth DEBUG]", code, JSON.stringify(args));
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      checks: ["state"],
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      console.log("[NextAuth signIn]", { provider: account?.provider, email: profile?.email });
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

export { handler as GET, handler as POST };
