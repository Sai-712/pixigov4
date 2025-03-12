/** @jsxImportSource react */
import { GoogleOAuthProvider } from "@react-oauth/google";
import React, { useEffect } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const GoogleAuthConfig: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Handle potential Google Sign-In errors gracefully
    const originalError = console.error;
    console.error = (...args) => {
      // Filter out known Google Sign-In errors in development
      if (
        args[0] && 
        typeof args[0] === 'string' && 
        (args[0].includes('GSI_LOGGER') || 
         args[0].includes('Failed to execute \'postMessage\'') ||
         args[0].includes('Error retrieving a token'))
      ) {
        // Suppress the error in development
        if (import.meta.env.DEV) {
          return;
        }
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    console.warn("Google Client ID is missing. OAuth features will be disabled.");
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider 
      clientId={GOOGLE_CLIENT_ID}
      onScriptLoadError={() => console.warn("Google Sign-In script failed to load")}
    >
      {children}
    </GoogleOAuthProvider>
  );
};