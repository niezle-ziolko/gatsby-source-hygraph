"use strict";

const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

function formatGraphQLFragment(fragment) {
  let formatted = '';
  let indent = 0;

  fragment.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.endsWith('{')) {
      formatted += '  '.repeat(indent) + trimmedLine + '\n';
      indent += 1;
    } else if (trimmedLine.endsWith('}')) {
      indent -= 1;
      formatted += '  '.repeat(indent) + trimmedLine + '\n';
    } else {
      formatted += '  '.repeat(indent) + trimmedLine + '\n';
    }
  });

  return formatted.trim();
}

function isMultimediaField(field) {
  return field.name.toLowerCase().includes('image') || 
         field.name.toLowerCase().includes('asset') || 
         field.name.toLowerCase().includes('file') ||
         (field.type && field.type.name && field.type.name.toLowerCase().includes('asset'));
}

function isEnumType(type) {
  return type.kind === 'ENUM';
}

function isListType(type) {
  return type.kind === 'LIST' || (type.ofType && type.ofType.kind === 'LIST');
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function getObjectSchema(typeName, schema) {
  const type = schema.find(t => t.name === typeName);
  if (!type) return '';

  const annotatedFields = await filterAndAnnotateFields(type.fields, schema);
  const fields = annotatedFields.join('\n  ');

  return `{
    ... on ${typeName} {
      ${fields}
    }
  }`;
}

async function filterAndAnnotateFields(fields, schema) {
  const excludedFields = ['localizations', 'documentInStages', 'history'];

  const annotatedFields = await Promise.all(fields.map(async (field) => {
    if (excludedFields.includes(field.name)) {
      return null;
    }

    if (field.name === 'scheduledIn') {
      return `${field.name}(first: 100) {
        ... on ScheduledOperation {
          __typename
          id
          stage
        }
      }`;
    }

    if (['publishedAt', 'updatedAt', 'createdAt'].includes(field.name)) {
      return `${field.name}(variation: COMBINED)`;
    }

    if (['publishedBy', 'updatedBy', 'createdBy'].includes(field.name)) {
      return `${field.name} {
        ... on User {
          __typename
          id
          stage
        }
      }`;
    }

    if (isMultimediaField(field)) {
      const isList = isListType(field.type);
      const prefix = isList ? `${field.name}(first: 100)` : field.name;

      return `${prefix} {
        ... on Asset {
          __typename
          id
          locale
          stage
        }
      }`;
    }

    if (isEnumType(field.type)) {
      return `${field.name}`;
    }

    if (isListType(field.type)) {
      const listTypeName = field.type.ofType.ofType.ofType && field.type.ofType.ofType.ofType.name 
        ? field.type.ofType.ofType.ofType.name 
        : capitalizeFirstLetter(field.name || 'UnknownType');
      return `${field.name}(first: 100) {
        ... on ${listTypeName} {
          __typename
          id
          locale
          stage
        }
      }`;
    }

    if (field.type.kind === 'OBJECT') {
      const objectSchema = await getObjectSchema(field.type.name, schema);
      return `${field.name} ${objectSchema}`;
    }

    return field.name;
  }));

  return annotatedFields.filter(field => field !== null);
}

exports.onPreBootstrap = async ({ reporter }) => {
  const fragmentsDir = path.resolve(__dirname, '.fragments');

  try {
    if (await fs.access(fragmentsDir).then(() => true).catch(() => false)) {
      reporter.info('Folder ".fragments" already exists. No need to fetch fragments.');
      return;
    }

    await fs.mkdir(fragmentsDir, { recursive: true });
    reporter.info('Folder ".fragments" has been created.');

    if (!process.env.ENDPOINT || !process.env.TOKEN) {
      reporter.error('ENDPOINT or TOKEN environment variables are not set.');
      return;
    }

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
    }

    const result = await response.json();

    if (!result.data || !result.data.__schema) {
      reporter.error('API response does not contain __schema.');
      console.log('Response:', result);
      return;
    }

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
      'RichText',
      'RGBA',
      'ShippingMethod',
      'Slice',
      'Tag',
      'TaxClass',
      'Upsell',
      'User'
    ];

    for (const type of schema) {
      if (type.kind === 'OBJECT' && allowedTypes.includes(type.name)) {
        const annotatedFields = await filterAndAnnotateFields(type.fields, schema);
        const fields = annotatedFields.join('\n  ');

        let fragment = `fragment ${type.name} on ${type.name} {\n  ${fields}\n}`;
        fragment = formatGraphQLFragment(fragment);

        const fragmentFilePath = path.join(fragmentsDir, `${type.name}.graphql`);
        await fs.writeFile(fragmentFilePath, fragment, 'utf8');
      }
    }

    reporter.success('GraphQL fragments have been fetched, formatted, and saved.');
  } catch (error) {
    reporter.error('An error occurred while fetching fragments:', error);
  }
};
