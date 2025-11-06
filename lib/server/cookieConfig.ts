
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";

// Checking if in a cross-origin setup
const isCrossOrigin = () => {
  const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const backendUrl = process.env.NEXT_PUBLIC_EXTERNAL_API_URL || "";
  
  if (!frontendUrl || !backendUrl) return false;
  
  try {
    const frontendOrigin = new URL(frontendUrl).origin;
    const backendOrigin = new URL(backendUrl).origin;
    return frontendOrigin !== backendOrigin;
  } catch {
    return false;
  }
};

export const cookieConfig = {
  secure: process.env.USE_SECURE_COOKIES === "true" || isProduction,

  sameSite: (process.env.COOKIE_SAME_SITE || 
             (isCrossOrigin() ? "none" : "lax")) as "strict" | "lax" | "none",
  
  httpOnly: true,
  
  prefix: process.env.COOKIE_PREFIX || "app_auth",
};

export const betterAuthCookieConfig = {
  advanced: {
    cookiePrefix: cookieConfig.prefix,

    useSecureCookies: cookieConfig.secure,
    
    crossSubDomainCookies: {
      enabled: process.env.ENABLE_SUBDOMAIN_COOKIES === "true",
      domain: process.env.COOKIE_DOMAIN,
    },

    cookieOptions: {
      sameSite: cookieConfig.sameSite,
    },
  },
};

export const validateCookieConfig = () => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check HTTPS requirement for secure cookies
  if (cookieConfig.secure && isDevelopment) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    if (baseUrl.startsWith("http://")) {
      errors.push(
        "⚠️ CRITICAL: secure=true requires HTTPS. " +
        "Your frontend is running on HTTP. " +
        "Either:\n" +
        "  1. Set USE_SECURE_COOKIES=false in development, or\n" +
        "  2. Configure local HTTPS (see setup guide)"
      );
    }
  }

  if (cookieConfig.sameSite === "none" && !cookieConfig.secure) {
    errors.push(
      "⚠️ CRITICAL: sameSite=none requires secure=true. " +
      "Browsers will reject these cookies."
    );
  }

  if (isCrossOrigin() && cookieConfig.sameSite !== "none") {
    warnings.push(
      "⚠️ WARNING: Cross-origin detected but sameSite is not 'none'. " +
      "Cookies may not be sent with cross-origin requests."
    );
  }

  if (isProduction && !cookieConfig.secure) {
    errors.push(
      "⚠️ CRITICAL: secure=false in production is a security vulnerability!"
    );
  }

  if (errors.length > 0) {
    console.error("\n❌ Cookie Configuration Errors:");
    errors.forEach(err => console.error(err));
    console.error("");
  }

  if (warnings.length > 0) {
    console.warn("\n⚠️  Cookie Configuration Warnings:");
    warnings.forEach(warn => console.warn(warn));
    console.warn("");
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log("✅ Cookie configuration validated successfully");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};


export const getDevSetupInstructions = () => {
  if (!cookieConfig.secure) {
    return null; // No HTTPS required
  }

  return `
🔧 HTTPS Development Setup Required

Your backend requires secure cookies (secure=true), but you're in development.

Option 1: Use local HTTPS (Recommended for production-like testing)
  
  # Install mkcert
  brew install mkcert              # macOS
  choco install mkcert             # Windows
  sudo apt install mkcert          # Linux
  
  # Generate certificates
  mkcert -install
  mkcert localhost 127.0.0.1 ::1
  
  # Update your dev server config (see documentation)

Option 2: Disable secure cookies in development

  # .env.development
  USE_SECURE_COOKIES=false
  COOKIE_SAME_SITE=lax
  
  # This matches your backend when it's also in development mode
`;
};

export const displayCookieConfig = () => {
  console.log("\n🍪 Cookie Configuration:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Environment:       ${process.env.NODE_ENV}`);
  console.log(`Secure:            ${cookieConfig.secure}`);
  console.log(`SameSite:          ${cookieConfig.sameSite}`);
  console.log(`HttpOnly:          ${cookieConfig.httpOnly}`);
  console.log(`Prefix:            ${cookieConfig.prefix}`);
  console.log(`Cross-origin:      ${isCrossOrigin()}`);
  console.log(`Frontend:          ${process.env.NEXT_PUBLIC_BASE_URL}`);
  console.log(`Backend:           ${process.env.NEXT_PUBLIC_EXTERNAL_API_URL}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
};

if (isDevelopment) {
  displayCookieConfig();
  const validation = validateCookieConfig();
  
  if (!validation.valid) {
    const instructions = getDevSetupInstructions();
    if (instructions) {
      console.log(instructions);
    }
  }
}