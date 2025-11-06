import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { anonymous } from "better-auth/plugins";
import { MongoClient } from "mongodb";

const BASE_URL = process.env.BASE_URL;
// const uri = "mongodb+srv://<db_username>:<db_password>@<clusterName>.mongodb.net/<databaseName>?retryWrites=true&w=majority";
const MONGODB_URI_WITH_DB_NAME = process.env.MONGODB_URI_WITH_DB_NAME;
const DB_NAME = process.env.DB_NAME;
if (!MONGODB_URI_WITH_DB_NAME) {
  throw new Error('Please define the MONGODB_URI environment variable in .env file');
}

const dbClient = new MongoClient(MONGODB_URI_WITH_DB_NAME!);
await dbClient.connect();
const dbMongo = dbClient.db(DB_NAME)

export const auth = betterAuth({
  database: mongodbAdapter(dbMongo),
  
  basePath: "/api/better-auth",

  baseURL: BASE_URL || 
           process.env.BACKEND_URL || 
           "http://localhost:4000",
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  plugins: [
    anonymous(),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  advanced: {
    cookiePrefix: "app_auth",
    useSecureCookies: process.env.USE_SECURE_COOKIES === "true",
    
    crossSubDomainCookies: {
      enabled: true,
      domain: undefined,
    },
    
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      path: "/",
    },
  },

  trustedOrigins: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    process.env.FRONTEND_OPTIONAL_URL || "http://localhost:5173",
    BASE_URL!,
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  ],
  
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;