import type { NextConfig } from "next";

// OWASP Security Headers Recommendation
const securityHeaders = [
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'DENY' }, // Mitiga Clickjacking
  { key: 'X-Content-Type-Options', value: 'nosniff' }, // Mitiga MIME sniffing
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { 
    key: 'Content-Security-Policy', 
    // Restringe drásticamente os domínios permitidos para prevenção contra XSS. (Em prod, remover unsafe inline se possível)
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://bwhfjsbgzbjsrrepssdi.supabase.co;" 
  },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' } // HSTS forçado
];

const nextConfig: NextConfig = {
  turbopack: {},
  // Security Misconfiguration Mitigation: Remove header "X-Powered-By: Next.js"
  poweredByHeader: false, 
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
