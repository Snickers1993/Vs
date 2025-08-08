import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const handler = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim() || "";
        const password = credentials?.password?.toString() || "";
        if (!email || !password) return null;
        return { id: email.toLowerCase(), email };
      },
    }),
  ],
  pages: { signIn: "/auth/signin" },
});
export { handler as GET, handler as POST };


