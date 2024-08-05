"use strict";

const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

const { formatField } = require('./utils');


async function fetchAssets(reporter) {
  const fragmentsDir = path.resolve(__dirname, '.fragments');
  const assetsDir = path.resolve(__dirname, '.assets');
  const endpoint = process.env.ENDPOINT;
  const token = process.env.TOKEN;
  const locales = ['en', 'pl'];

  try {
    const fragmentsExist = await fs.access(fragmentsDir).then(() => true).catch(() => false);

    if (fragmentsExist) {
      const files = await fs.readdir(fragmentsDir);

      for (const file of files) {
        const fragmentName = path.basename(file, path.extname(file));
        const fragmentPath = path.join(fragmentsDir, file);
        const fragmentContent = await fs.readFile(fragmentPath, 'utf8');

        const pluralName = formatField(fragmentName);

        for (const locale of locales) {
          const query = `query {
            ${pluralName}(locales: ${locale}) {
              ...${fragmentName}
            }
          }

          ${fragmentContent}`;

          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token
              },
              body: JSON.stringify({ query })
            });

            if (!response.ok) {
              const errorBody = await response.text();
              throw new Error(`HTTP error! status: ${response.status}, response: ${errorBody}`);
            };

            const data = await response.json();

            const assetsExist = await fs.access(assetsDir).then(() => true).catch(() => false);

            if (!assetsExist) {
              await fs.mkdir(assetsDir);
            };

            const assetFileName = `${pluralName}-${locale}.json`;
            const assetFilePath = path.join(assetsDir, assetFileName);

            await fs.writeFile(assetFilePath, JSON.stringify(data, null, 2));

            reporter.success(`fetching ${pluralName}-${locale}`);
          } catch (fetchError) {
            reporter.error(`Failed to fetch data for ${pluralName} with locale ${locale}:`, fetchError);
            await new Promise(resolve => setTimeout(resolve, 600));
          };
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