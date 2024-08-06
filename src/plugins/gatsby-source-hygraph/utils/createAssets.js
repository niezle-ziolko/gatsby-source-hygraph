"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

const { formatField } = require('./utils');


async function fetchAssets(reporter, options) {
  const fragmentsDir = path.resolve(process.cwd(), options.fragmentsPath || '.fragments');
  const assetsDir = path.resolve(process.cwd(), options.assetsPath || '.assets');
  const locales = options.locales || ['en'];
  const stages = options.stages || ['PUBLISHED'];

  try {
    const fragmentsExist = await fs.access(fragmentsDir).then(() => true).catch(() => false);

    if (fragmentsExist) {
      const files = await fs.readdir(fragmentsDir);

      for (const file of files) {
        const fragmentName = path.basename(file, path.extname(file));
        const fragmentPath = path.join(fragmentsDir, file);
        const fragmentContent = await fs.readFile(fragmentPath, 'utf8');

        const pluralName = formatField(fragmentName);
        const aggregatedData = {};

        for (const locale of locales) {
          for (const stage of stages) {
            const query = `query {
              ${pluralName}(locales: ${locale}, stage: ${stage}) {
                ...${fragmentName}
              }
            }

            ${fragmentContent}`;

            try {
              const response = await fetch(options.endpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': options.token
                },
                body: JSON.stringify({ query })
              });

              if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, response: ${errorBody}`);
              };

              const data = await response.json();
              if (!aggregatedData[locale]) {
                aggregatedData[locale] = {};
              };
              aggregatedData[locale][stage] = data;
            } catch (fetchError) {
              reporter.error(`Failed to fetch data for ${pluralName} with locale ${locale} and stage ${stage}:`, fetchError);
              await new Promise(resolve => setTimeout(resolve, 600));
            };
          };
        };

        try {
          const assetsExist = await fs.access(assetsDir).then(() => true).catch(() => false);
          if (!assetsExist) {
            await fs.mkdir(assetsDir);
          };

          const assetFileName = `${pluralName}.json`;
          const assetFilePath = path.join(assetsDir, assetFileName);

          await fs.writeFile(assetFilePath, JSON.stringify(aggregatedData, null, 2));
          reporter.success(`fetching ${pluralName}`);
        } catch (writeError) {
          reporter.error(`Failed to write data for ${pluralName}:`, writeError);
        };
      };
    } else {
      reporter.info('.fragments folder does not exist, skipping GraphQL queries.');
    };
  } catch (error) {
    reporter.error('An error occurred while processing fragments:', error);
  };
};

module.exports = { fetchAssets };