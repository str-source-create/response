const { createServer } = require('./src/server');

const port = Number(process.env.PORT || 3000);
const server = createServer();

server.listen(port, () => {
  process.stdout.write(`Server listening on port ${port}\n`);
});
