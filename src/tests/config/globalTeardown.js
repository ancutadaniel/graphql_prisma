const globalTeardown = async () => {
  await global.httpServer.close();
};

export default globalTeardown;
