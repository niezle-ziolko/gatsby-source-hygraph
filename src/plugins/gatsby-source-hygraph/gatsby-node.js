"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { fetchFragments } = require('./utils/createFragments');
const { fetchAssets } = require('./utils/createAssets');


exports.onPreBootstrap = async ({ reporter }, options) => {
  try {
    await fetchFragments(reporter, options);
    await fetchAssets(reporter, options);
  } catch (error) {
    reporter.error('An error occurred during onPreBootstrap:', error);
  };
};