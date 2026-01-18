import "dotenv/config";

// Prisma 7+ configuration file for Migrate and tools
// Move connection URLs here so they are not embedded in schema.prisma

const config = {
  datasources: {
    db: {
      // Used by migration tools. Keep the full DATABASE_URL here.
      url: process.env.DATABASE_URL,
      // directUrl is useful for direct connections (non-pgbouncer)
      directUrl: process.env.DIRECT_URL,
    },
  },
};

export default config;
