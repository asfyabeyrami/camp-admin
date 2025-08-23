module.exports = {
  apps: [
    {
      name: "camp-admin",
      script: "pnpm",
      args: "start",
      env: {
        PORT: 5173,
        NODE_ENV: "production",
      },
    },
  ],
};
