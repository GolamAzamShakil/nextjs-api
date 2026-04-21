import swaggerJsdoc from "swagger-jsdoc";


const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Next.js REST API",
      version: "1.0.0",
      description: `
## Authentication

This API supports two parallel auth mechanisms issued together on signin:

- **Bearer Token** — Short-lived JWT passed via \`Authorization: Bearer <token>\`
- **Session Cookie** — HttpOnly cookie set automatically by the browser on signin

## Authorization (RBAC)

Role-based access is enforced via a **custom dependency function** (not middleware).
Roles in descending order of privilege: \`admin\` › \`editor\` › \`viewer\`

## How to Use These Docs

1. Expand **Auth → POST /api/auth/signin**
2. Select a role from the **example dropdown** (admin / editor / viewer)
3. Click **Execute** — Bearer token is auto-applied to all subsequent requests
4. Session cookie is stored automatically by the browser
5. Try protected or admin routes — observe auth, RBAC, and custom response headers in action
6. To see RBAC rejection: authorize as \`viewer\`, then call an \`/api/admin/*\` route → **403**
      `,
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
        description: `${process.env.NODE_ENV ? process.env.NODE_ENV.charAt(0).toUpperCase() + process.env.NODE_ENV.slice(1).toLowerCase() : "Not defined"} server`,
      },
    ],
    tags: [
      {
        name: "Auth",
        description:
          "signin, signout, token refresh. **Start here** to authorize all other requests.",
      },
      {
        name: "Public",
        description: "No authentication required. Accessible by anyone.",
      },
      {
        name: "Protected",
        description:
          "Requires a valid Bearer token or active session cookie. Any authenticated role.",
      },
      {
        name: "Admin",
        description:
          "Requires role: `admin`. RBAC enforced by custom dependency function.",
      },
      /* {
        name: "Editor",
        description:
          "Requires role: `editor` or above. RBAC enforced by custom dependency function.",
      }, */
      {
        name: "Better Auth",
        description: `
        Routes handled internally by **better-auth** via \`toNextJsHandler(auth)\`.
        GET and POST are auto-handled. PUT is proxied with custom CORS headers via \`getAuthCorsHeaders\`.
        These paths are documented manually as better-auth routing is not introspectable.
        `,
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Short-lived JWT. Automatically applied after executing POST /api/auth/signin.",
        },
        CookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "session",
          description:
            "HttpOnly session cookie. Set automatically by the browser on signin.",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: { type: "string", example: "Unauthorized" },
            code: { type: "string", example: "AUTH_REQUIRED" },
          },
        },
        ForbiddenError: {
          type: "object",
          properties: {
            message: { type: "string", example: "Forbidden" },
            code: { type: "string", example: "INSUFFICIENT_ROLE" },
            requiredRole: { type: "string", example: "admin" },
            yourRole: { type: "string", example: "viewer" },
          },
        },
        ProductDetails: {
          type: "object",
          properties: {
            productAltId: { type: "string", example: "" },
            productCategory: { type: "string", example: "" },
            productImageLink: { type: "string", example: "" },
            productAvailability: { type: "string", example: "" },
          },
        },
        Product: {
          type: "object",
          properties: {
            productId: { type: "string", example: "" },
            productName: { type: "string", example: "" },
            productDetails: {
              productDetails: { $ref: "#/components/schemas/ProductDetails" },
            },
          },
        },
        productPostRequest: {
          type: "object",
          properties: {
            productName: { type: "string", example: "" },
            productAltId: { type: "string", example: "" },
            productCategory: { type: "string", example: "" },
            productImageLink: { type: "string", example: "" },
            productAvailability: { type: "string", example: "" },
          },
        },
        User: {
          type: "object",
          properties: {
            userId: { type: "string", example: "viewer_JohnTery77_g83H9" },
            userName: { type: "string" },
            userEmail: { type: "string", format: "email" },
            isMfaEnabled: { type: "boolean", example: false },
            roles: {
              type: "string",
              enum: ["guest", "viewer", "user", "editor", "moderator", "admin"],
              example: ["guest"],
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        signinRequest: {
          type: "object",
          required: ["email", "password", "authMode"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", format: "password", minLength: 8 },
            authMode: { type: "string", example: "bearer" },
          },
        },
        signinResponse: {
          type: "object",
          properties: {
            user: {
              user: { $ref: "#/components/schemas/User" },
            },
            accessToken: {
              type: "string",
              description: "Long-lived JWT. Use as Bearer token.",
            },
            refreshToken: {
              type: "string",
              description: "Short-lived JWT. Use as Bearer token.",
            },
            expiresIn: {
              type: "integer",
              example: 900,
              description: "Token expiry in seconds.",
            },
          },
        },
        signupRequest: {
          type: "object",
          required: [
            "email",
            "password",
            "confirmPassword",
            "isMfaEnabled",
            "roles",
          ],
          properties: {
            name: { type: "string", example: "John Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@demo.com",
            },
            password: { type: "string", format: "password", minLength: 8 },
            confirmPassword: {
              type: "string",
              format: "password",
              minLength: 8,
            },
            isMfaEnabled: { type: "boolean", example: false },
            roles: {
              type: "string",
              example: ["guest"],
            },
          },
        },
        signupResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
            token: {
              type: "string",
              description: "Auto-issued access token on signup.",
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "Missing or invalid authentication token.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { message: "Unauthorized", code: "AUTH_REQUIRED" },
            },
          },
        },
        Forbidden: {
          description:
            "Token is valid but role is insufficient for this resource.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForbiddenError" },
              example: {
                message: "Forbidden",
                code: "INSUFFICIENT_ROLE",
                requiredRole: "admin",
                yourRole: "viewer",
              },
            },
          },
        },
      },
      paths: {
        "/api/better-auth/sign-in/email": {
          post: {
            tags: ["Better Auth"],
            summary: "Sign in with email and password",
            security: [],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                      email: { type: "string", format: "email" },
                      password: { type: "string", format: "password" },
                      rememberMe: { type: "boolean", default: false },
                    },
                  },
                },
              },
            },
            responses: {
              200: {
                description:
                  "Authenticated. Session cookie set by better-auth.",
                headers: {
                  "Set-Cookie": {
                    description: "better-auth session cookie (HttpOnly).",
                    schema: { type: "string" },
                  },
                },
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        token: { type: "string" },
                        user: { $ref: "#/components/schemas/User" },
                      },
                    },
                  },
                },
              },
              401: { $ref: "#/components/responses/Unauthorized" },
            },
          },
        },

        "/api/better-auth/sign-up/email": {
          post: {
            tags: ["Better Auth"],
            summary: "Register with email and password",
            security: [],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SignupRequest" },
                },
              },
            },
            responses: {
              201: {
                description: "User created. Session cookie set automatically.",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/SignupResponse" },
                  },
                },
              },
              409: {
                description: "Email already registered.",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Error" },
                    example: {
                      message: "Email already in use",
                      code: "EMAIL_CONFLICT",
                    },
                  },
                },
              },
            },
          },
        },

        "/api/better-auth/sign-out": {
          post: {
            tags: ["Better Auth"],
            summary: "Sign out and clear session",
            security: [{ BearerAuth: [] }, { CookieAuth: [] }],
            responses: {
              200: {
                description: "Session cleared.",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },

        "/api/better-auth/get-session": {
          get: {
            tags: ["Better Auth"],
            summary: "Get current active session",
            security: [{ BearerAuth: [] }, { CookieAuth: [] }],
            responses: {
              200: {
                description: "Active session returned.",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        session: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            userId: { type: "string" },
                            expiresAt: { type: "string", format: "date-time" },
                          },
                        },
                        user: { $ref: "#/components/schemas/User" },
                      },
                    },
                  },
                },
              },
              401: { $ref: "#/components/responses/Unauthorized" },
            },
          },
        },
        "/api/better-auth/{action}": {
          put: {
            tags: ["Better Auth"],
            summary:
              "Custom PUT handler (proxied through better-auth with CORS)",
            description: `
            Proxies PUT requests through \`auth.handler\` with custom CORS headers applied.
            Used for better-auth operations that require PUT semantics (e.g. update session, update user).
      
            CORS headers are applied via \`getAuthCorsHeaders(origin)\`.
            Errors are returned via \`authCorsJson\` with CORS headers preserved.
            `,
            security: [{ BearerAuth: [] }, { CookieAuth: [] }],
            parameters: [
              {
                in: "path",
                name: "action",
                required: true,
                schema: { type: "string" },
                description: "better-auth internal action path segment.",
              },
            ],
            responses: {
              200: {
                description: "Proxied response from better-auth handler.",
              },
              500: {
                description: "Internal server error from auth handler.",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Error" },
                    example: { error: "Internal server error" },
                  },
                },
              },
            },
          },
        },
        /* "/api/better-auth/{...path}": {
          get: {
            tags: ["Better Auth"],
            summary: "better-auth GET handler (catch-all)",
            security: [],
            parameters: [
              {
                in: "path",
                name: "path",
                required: true,
                schema: { type: "string" },
                example: "get-session",
                description:
                  "better-auth internal route. See better-auth docs for all paths.",
              },
            ],
            responses: {
              200: { description: "Handled internally by better-auth." },
            },
          },
          post: {
            tags: ["Better Auth"],
            summary: "better-auth POST handler (catch-all)",
            security: [],
            // same pattern...
          },
        }, */
      },
      parameters: {
        RequestID: {
          in: "header",
          name: "X-Request-ID",
          schema: { type: "string", format: "uuid" },
          description: "Optional idempotency / tracing header.",
        },
        UserName: {
          in: "path",
          name: "userName",
          required: true,
          schema: { type: "string" },
          example: "JohnTery41",
          description: "The unique user name of the user.",
        },
        UserId: {
          in: "path",
          name: "userId",
          required: true,
          schema: { type: "string" },
          example: "user_JohnTery41_78ga6",
          description: "The unique user ID of the user.",
        },
      },
      headers: {
        XRequestID: {
          description: "Echoed or generated unique request identifier.",
          schema: { type: "string", format: "uuid" },
        },
        XAuthMethod: {
          description: "Which auth mechanism was resolved for this request.",
          schema: { type: "string", enum: ["bearer", "cookie"] },
        },
        XRole: {
          description: "The RBAC role resolved from the token.",
          schema: { type: "string", enum: ["admin", "editor", "viewer"] },
        },
        XRateLimitLimit: {
          description: "Max requests allowed per window.",
          schema: { type: "integer", example: 100 },
        },
        XRateLimitRemaining: {
          description: "Requests remaining in current window.",
          schema: { type: "integer", example: 99 },
        },
      },
    },

    security: [{ BearerAuth: [] }, { CookieAuth: [] }],
  },
  apis: ["./src/app/api/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
