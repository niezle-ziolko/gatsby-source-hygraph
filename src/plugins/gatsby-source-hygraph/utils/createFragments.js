"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

const { filterFields, formatFragment } = require('./utils');


async function fetchFragments(reporter, options) {
  const fragmentsDir = path.resolve(process.cwd(), options.fragmentsPath || '.fragments');

  try {
    if (await fs.access(fragmentsDir).then(() => true).catch(() => false)) {
      reporter.info(`Folder "${options.fragmentsPath || '.fragments'}" already exists. No need to fetch fragments.`);
     
      return;
    };

    await fs.mkdir(fragmentsDir, { recursive: true });
      reporter.info(`Folder "${options.fragmentsPath || '.fragments'}" has been created.`);

      if (!options.endpoint || !options.token) {
        reporter.error('ENDPOINT or TOKEN options are not set.');
      
        return;
      };

      const response = await fetch(options.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${options.token}`
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
          `
        })
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
      const excludedFieldNames = ['count', 'node', 'pageInfo', 'hex', 'latitude', 'raw'];

      const allowedTypes = options.allowedTypes || schema
        .filter(type => 
          (!type.fields || !type.fields.some(field => 
            excludedFieldNames.some(excluded => field.name.includes(excluded))
          ))
        )
        .map(type => type.name);

      for (const type of schema) {
        if (type.kind === 'OBJECT' && allowedTypes.includes(type.name)) {
          const annotatedFields = await filterFields(type.fields, schema, options);
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