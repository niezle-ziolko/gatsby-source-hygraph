"use strict";

const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

const { filterFields, formatFragment } = require('./utils');


async function fetchFragments(reporter) {
  const fragmentsDir = path.resolve(__dirname, '.fragments');

  try {
    if (await fs.access(fragmentsDir).then(() => true).catch(() => false)) {
      reporter.info('Folder ".fragments" already exists. No need to fetch fragments.');
      return;
    };

    await fs.mkdir(fragmentsDir, { recursive: true });
    reporter.info('Folder ".fragments" has been created.');

    if (!process.env.ENDPOINT || !process.env.TOKEN) {
      reporter.error('ENDPOINT or TOKEN environment variables are not set.');
      
      return;
    };

    const response = await fetch(process.env.ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TOKEN}`
      },
      body: JSON.stringify({
        query: `
          {
            __schema {
              types {
                kind
                name
                fields {
                  name
                  type {
                    name
                    kind
                    ofType {
                      name
                      kind
                      ofType {
                        name
                        kind
                        ofType {
                          name
                          kind
                          fields {
                            name
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      reporter.error(`API response error: ${text}`);
      
      return;
    };

    const result = await response.json();

    if (!result.data || !result.data.__schema) {
      reporter.error('API response does not contain __schema.');
      console.log('Response:', result);
      
      return;
    };

    const schema = result.data.__schema.types;

    const allowedTypes = [
      'Asset',
      'Category',
      'Content',
      'Currency',
      'Page',
      'PaymentMethod',
      'Producer',
      'Product',
      'ShippingMethod',
      'Slice',
      'Tag',
      'TaxClass',
      'Upsell',
      'User'
    ];

    for (const type of schema) {
      if (type.kind === 'OBJECT' && allowedTypes.includes(type.name)) {
        const annotatedFields = await filterFields(type.fields, schema);
        const fields = annotatedFields.join('\n  ');

        let fragment = `fragment ${type.name} on ${type.name} {\n  ${fields}\n}`;
        fragment = formatFragment(fragment);

        const fragmentFilePath = path.join(fragmentsDir, `${type.name}.graphql`);
        await fs.writeFile(fragmentFilePath, fragment, 'utf8');
      };
    };

    reporter.success('GraphQL fragments have been fetched, formatted, and saved.');
  } catch (error) {
    reporter.error('An error occurred while fetching fragments:', error);
  };
};

module.exports = { fetchFragments };