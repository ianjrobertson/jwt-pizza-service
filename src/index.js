const Logger = require('pizza-logger');
const app = require('./service.js');
const config = require('./config.js');

const logger = new Logger(config);
process.on("uncaughtException", (err) => {
  logger.unhandledErrorLogger(err);
})

const port = process.argv[2] || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);

  setInterval(() => {
    throw new Error("Uncaught Pizza exception!");
  }, 60000);
});
