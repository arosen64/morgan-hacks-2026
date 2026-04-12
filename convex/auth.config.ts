export default {
  providers: [
    {
      // Convex fetches {domain}/.well-known/openid-configuration to discover JWKS.
      // Our HTTP actions serve both endpoints from the Convex site URL.
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
