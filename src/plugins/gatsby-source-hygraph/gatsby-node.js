"use strict";
const { fetchFragments } = require('./utils/createFragments');


exports.onPreBootstrap = async ({ reporter }) => {
  try {
    await fetchFragments(reporter);
  } catch (error) {
    reporter.error('An error occurred during onPreBootstrap:', error);
  };
};