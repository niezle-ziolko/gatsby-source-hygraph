"use strict";

const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');


function toPlural(word) {
  const lowerWord = word.toLowerCase();
  let plural = '';

  if (lowerWord.endsWith('y')) {
    plural = word.slice(0, -1) + 'ies';
  } else if (lowerWord.endsWith('s') || 
             lowerWord.endsWith('x') ||
             lowerWord.endsWith('z') ||
             lowerWord.endsWith('sh') ||
             lowerWord.endsWith('ch')
            ) {
    plural = word + 'es';
  } else if (lowerWord.endsWith('class')) {
    plural = word + 'es';
  } else {
    plural = word + 's';
  };

  return plural.charAt(0).toLowerCase() + plural.slice(1);
};

async function fetchAssets(reporter) {
  const fragmentsDir = path.resolve(__dirname, '.fragments');
  const endpoint = process.env.ENDPOINT;
  const token = process.env.TOKEN;

  try {
    const fragmentsExist = await fs.access(fragmentsDir).then(() => true).catch(() => false);

    if (fragmentsExist) {
      const files = await fs.readdir(fragmentsDir);

      for (const file of files) {
        const fragmentName = path.basename(file, path.extname(file));
        const fragmentPath = path.join(fragmentsDir, file);
        const fragmentContent = await fs.readFile(fragmentPath, 'utf8');

        const pluralName = toPlural(fragmentName);
        const query = `query {
          ${pluralName} {
            ...${fragmentName}
          }
        }

        ${fragmentContent}`;

        console.log(`Generated GraphQL query for ${pluralName}:\n${query}\n`);

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
          reporter.success(`GraphQL query for ${pluralName} has been successfully sent and processed.`);
        } catch (fetchError) {
          reporter.error(`Failed to fetch data for ${pluralName}:`, fetchError);
          await new Promise(resolve => setTimeout(resolve, 1000));
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