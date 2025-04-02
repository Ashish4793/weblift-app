import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { PrismaClient } from "@prisma/client";
import { fetchGitHubEmail } from "../utils/githubFunctions.js";

const prisma = new PrismaClient();

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});


// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {

        let user = await prisma.user.findUnique({
          where: { oauthId: profile.id, oauthProvider: "github" },
        });

        if (!user) {
          // Create user with a temporary email
          user = await prisma.user.create({
            data: {
              oauthId: profile.id,
              oauthProvider: "github",
              email: `github-${profile.id}@no-email.com`, // Temporary email
              name: profile.displayName,
              githubUserName: profile.username,
              githubAccessToken: accessToken
            },
          });
          // 🔹 Fetch the actual email from GitHub API
          const githubEmail = await fetchGitHubEmail(accessToken);

          if (githubEmail && githubEmail !== user.email) {
            await prisma.user.update({
              where: { id: user.id },
              data: { email: githubEmail },
            });
          }
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { githubAccessToken: accessToken },
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);
