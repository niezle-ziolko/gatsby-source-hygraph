"use strict";
const { fetchFragments } = require('./utils/createFragments');
const { fetchAssets } = require('./utils/createAssets');


exports.onPreBootstrap = async ({ reporter }) => {
  try {
    await fetchFragments(reporter);
    await fetchAssets(reporter);
  } catch (error) {
    reporter.error('An error occurred during onPreBootstrap:', error);
  };
};