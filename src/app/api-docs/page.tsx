"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { useEffect, useRef, useState } from "react";

export default function SwaggerPage() {
  const [spec, setSpec] = useState(null);
  const [tokenCaptured, setTokenCaptured] = useState(false);
  const swaggerRef = useRef<any>(null);

  useEffect(() => {
    fetch("/api/docs")
      .then((r) => r.json())
      .then(setSpec);
  }, []);

  const responseInterceptor = (response: any) => {
    if (response.url?.includes("/api/auth/login") && response.status === 200) {
      try {
        const body = JSON.parse(response.text || "{}");
        if (body.accessToken && swaggerRef.current) {
          swaggerRef.current.preauthorizeApiKey("BearerAuth", body.accessToken);
          setTokenCaptured(true);
          setTimeout(() => setTokenCaptured(false), 4000);
        }
      } catch {
        // Non-JSON response — ignore silently
      }
    }
    return response;
  };

  // Attach custom headers to every outgoing request
  const requestInterceptor = (request: any) => {
    if (!request.headers["X-Request-ID"]) {
      request.headers["X-Request-ID"] = crypto.randomUUID();
    }
    request.headers["X-Client"] = "swagger-ui";
    return request;
  };

  if (!spec) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 font-mono text-sm text-gray-500">
        <span>Loading API docs…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {tokenCaptured && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white text-sm font-mono px-4 py-2.5 rounded-md shadow-lg animate-fade-out pointer-events-none">
          ✓ Bearer token captured — all requests are now authorized
        </div>
      )}
      <SwaggerUI
        //url="/api/docs"
        spec={spec}
        persistAuthorization={true}
        displayRequestDuration={true}
        tryItOutEnabled={true}
        filter={true}
        requestInterceptor={requestInterceptor}
        responseInterceptor={responseInterceptor}
        onComplete={(system: any) => {
          swaggerRef.current = system;
        }}
      />
    </div>
  );
}
