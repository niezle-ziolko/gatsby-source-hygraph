"use strict"
const fs = require('fs').promises;
const path = require('path');


function formatFragment(fragment) {
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
    };
  });

  return formatted.trim();
};

function isMultimediaField(field) {
  return field.name.toLowerCase().includes('asset') || 
         (field.type && field.type.name && field.type.name.toLowerCase().includes('asset'));
};

function isEnumType(type) {
  return type.kind === 'ENUM';
};

function isListType(type) {
  return type.kind === 'LIST' || (type.ofType && type.ofType.kind === 'LIST');
};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

async function getObjectSchema(typeName, schema) {
  const type = schema.find(t => t.name === typeName);
  if (!type) return '';

  const excludedFields = [
    'publishedAt', 'updatedAt', 'createdAt',
    'publishedBy', 'updatedBy', 'createdBy', 'scheduledIn'
  ];

  const annotatedFields = await filterFields(type.fields, schema, excludedFields);
  const fields = annotatedFields.join('\n  ');

  return `{
    ... on ${typeName} {
      ${fields}
    }
  }`;
};

function getFieldQuery(field, listTypeName) {
  const commonFields = ['__typename', 'id', 'stage'];

  const fields = field?.type?.ofType?.ofType?.ofType?.fields || [];
  const localeField = fields.some(f => f.name === 'locale') ? 'locale' : '';

  if (localeField) {
    commonFields.splice(2, 0, localeField);
  };

  return `${field.name}(first: 100) {
    ... on ${listTypeName} {
      ${commonFields.join('\n')}
    }
  }`;
};

async function filterFields(fields, schema, excludedFields = []) {
  const commonExcludedFields = ['localizations', 'documentInStages', 'history'];

  const annotatedFields = await Promise.all(fields.map(async (field) => {
    if (commonExcludedFields.includes(field.name) || excludedFields.includes(field.name)) {
      return null;
    };

    if (field.name === 'scheduledIn') {
      return `${field.name}(first: 100) {
        ... on ScheduledOperation {
          __typename
          id
          stage
        }
      }`;
    };

    if (['publishedBy', 'updatedBy', 'createdBy'].includes(field.name)) {
      return `${field.name} {
        ... on User {
          __typename
          id
          stage
        }
      }`;
    };

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
    };

    if (isEnumType(field.type)) {
      return `${field.name}`;
    };

    if (isListType(field.type)) {
      const listTypeName = field.type.ofType.ofType.ofType && field.type.ofType.ofType.ofType.name 
        ? field.type.ofType.ofType.ofType.name 
        : capitalizeFirstLetter(field.name || 'UnknownType');
      
      return getFieldQuery(field, listTypeName);
    }

    if (field.type.kind === 'OBJECT') {
      const fragmentsDir = path.resolve(__dirname, '.fragments');
      const fragmentFilePath = path.join(fragmentsDir, `${field.type.name}.graphql`);
      const fragmentExists = await fs.access(fragmentFilePath).then(() => true).catch(() => false);

      if (fragmentExists) {
        return `${field.name} {
          ... on ${field.type.name} {
            __typename
            id
            locale
            stage          
          }
        }`;
      } else {
        const objectSchema = await getObjectSchema(field.type.name, schema);
        return `${field.name} ${objectSchema}`;
      };
    };

    return field.name;
  }));

  return annotatedFields.filter(field => field !== null);
};

module.exports = {
  filterFields,
  formatFragment
};