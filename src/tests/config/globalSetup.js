import server from '../../server.js';

const globalSetup = async () => {
  global.httpServer = server.listen(4000, () => {
    console.info('Server is running on http://localhost:4000/graphql');
  });
};

export default globalSetup;
