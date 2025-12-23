import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prismaClient } from "@repo/db";
import GithubProvider from "next-auth/providers/github";

// Validate required environment variables
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_SECRET;
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_SECRET;
// const nextAuthUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
const nextAuthSecret = process.env.NEXTAUTH_SECRET || "fallback_secret";
console.log("nextauth secret length", nextAuthSecret.length);
const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  // Set the base URL for OAuth callbacks
  // url: nextAuthUrl,
  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",
  // Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: googleClientId || "",
      clientSecret: googleClientSecret || "",
      // authorization: {
      //   params: {
      //     prompt: "consent",
      //     access_type: "offline",
      //     response_type: "code",
      //   },
      // },
    }),
    GithubProvider({
      clientId: githubClientId || "",
      clientSecret: githubClientSecret || "",
    }),

    // ...add more providers here
  ],
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/signin",
    error: "/signin", // Redirect errors back to signin page
  },

  callbacks: {
    async jwt({ token, user, account, profile }) {
      try {
        if (user && account) {
          const provider = account.provider || "github";
          if (provider === "github" && !profile?.login) {
            throw new Error("Username (Login) is required");
          }
          if (provider === "google" && !user.email) {
            throw new Error("Email is required");
          }
          const whereObj = {
            ...(account.provider === "github"
              ? {
                  username: profile?.login,
                  provider: account.provider,
                }
              : {
                  email: user.email,
                  provider: account.provider,
                }),
          };
          const userInfo = await prismaClient.user.findFirst({
            where: whereObj,
          });

          if (userInfo) {
            if (userInfo.email) {
              token.email = userInfo.email;
            }
            token.username = userInfo.username;
            token.userId = userInfo.id;
          } else {
            const newEntry = await prismaClient.user.create({
              data: {
                ...(provider === "google" && { email: user.email }),
                username:
                  provider === "github"
                    ? (profile?.login ?? "")
                    : (user.name ?? ""),
                ...(user.email && { email: user.email }),

                provider,
              },
            });
            if (newEntry.email) {
              token.email = newEntry.email;
            }
            token.username = newEntry.username;
            token.userId = newEntry.id;
          }
        }
        console.log("token in jwt", token);
        return token;
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(err.message);
        }
        throw new Error("Something went wrong");
      }
    },
    async session({ session, token }) {
      try {
        if (token.userId && token.username && token.email) {
          session.user = {
            userId: token.userId,
            username: token.username,
            email: token.email,
          };
        }
        return session;
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(err.message);
        }
        throw new Error("Something went wrong");
      }
    },
  },
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Export auth function for use in API routes
// export const auth = async () => {
//   return await handler.auth();
// };

declare module "next-auth" {
  interface User {
    userId?: string;
    username?: string;
  }
  interface Profile {
    login?: string;
  }
  interface Session {
    user: {
      userId?: string;
      username?: string;
      email?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    username?: string;
    email?: string;
  }
}
