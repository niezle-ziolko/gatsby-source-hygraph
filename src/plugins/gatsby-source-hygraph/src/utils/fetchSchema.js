"use strict";
const toolkit = require('gatsby-graphql-source-toolkit');

const specialNames = new Set(['localizations', 'documentInStages', 'history']);

const isType = (type, typeName) => type.name === typeName;
const isListType = (type) => type.ofType && type.ofType.ofType;
const isObjectType = (type) => type.getFields;


async function fetchSchema(gatsbyApi, pluginOptions) {
  const { stages, locales, endpoint, allowedTypes } = pluginOptions;

  const execute = toolkit.createDefaultQueryExecutor(endpoint);
  const schema = await toolkit.loadSchema(execute);
  const nodeInterface = schema.getType('Node');
  const queryFields = schema.getType('Query').getFields();
  const possibleTypes = schema.getPossibleTypes(nodeInterface);

  const pluralFieldName = (type) => 
    Object.keys(queryFields).find(fieldName => 
      String(queryFields[fieldName].type) === `[${type.name}!]!`
    );

  const getFieldsFragment = (type) => {
    const fields = type.getFields();
    return Object.entries(fields)
      .filter(([fieldName]) => !specialNames.has(fieldName))
      .map(([fieldName, field]) => {
        const fieldType = field.type.ofType || field.type;

        if (isType(fieldType, 'Asset') || isType(fieldType, 'User')) {
          return `${fieldName} {
            ... on ${fieldType.name} {
              __typename
              id
              locale
              stage
            }
          }`;
        };

        if (isType(fieldType, 'DateTime')) {
          return `${fieldName}(variation: COMBINED)`;
        };

        if (isListType(field.type)) {
          return `${fieldName}(first: 100) {
            ... on ${fieldType.ofType.ofType.name} {
              __typename
              id
              locale
              stage
            }
          }`;
        };

        if (isObjectType(fieldType)) {
          return `${fieldName} {
            ... on ${fieldType.name} {
              ${getFieldsFragment(fieldType)}
            }
          }`;
        };

        return fieldName;
      })
      .join('\n');
  };

  const gatsbyNodeTypes = possibleTypes
    .filter(type => !allowedTypes || allowedTypes.includes(type.name))
    .map(type => {
      const plural = pluralFieldName(type);
      const allFieldsFragment = getFieldsFragment(type);

      const queries = locales.flatMap(locale => {
        const localeLabel = locale.replace('_', '');
        return stages.map(stage => 
          `query ${plural}_${localeLabel}_${stage} { 
            ${plural}(first: $limit, ${type.getFields().locale ? `locales: [${locale}, ${locales[0]}]` : ""}, stage: ${stage}) {
              ..._${type.name}_
            }
          }`
        );
      });

      const config = {
        remoteTypeName: type.name,
        queries: [
          ...queries,
          `fragment _${type.name}_ on ${type.name} {
            ${allFieldsFragment}
          }`
        ].join('\n'),
        
        nodeQueryVariables: ({ id, stage, locale }) => ({
          where: { id },
          locales: [locale],
          stage
        })
      };
      
      return config;
    });

  return {
    gatsbyApi,
    schema,
    gatsbyNodeTypes
  };
};

exports.fetchSchema = fetchSchema;