#!/usr/bin/env node

const { main } = require('../lib/index');

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
