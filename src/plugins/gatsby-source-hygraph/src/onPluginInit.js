"use strict";
const { fetchSchema } = require('./utils/fetchSchema');
const { createFragments } = require('./utils/createFragments');

async function onPluginInit(args, options) {
  const schemaInformation = await fetchSchema(args, options, exports);
  await createFragments(schemaInformation, options, exports);
};

exports.onPluginInit = onPluginInit;