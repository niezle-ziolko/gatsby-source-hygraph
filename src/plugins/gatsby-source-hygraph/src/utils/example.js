"use strict"

const { getGatsbyImageResolver } = require('gatsby-plugin-image/graphql-utils');
const fetch = require('node-fetch');

const { resolveGatsbyImageData } = require('./functions/images');


exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;
  createTypes(`
    type ProductImage implements Node {
      fileName: String
      handle: String
      height: Int
      width: Int
      url: String
      gatsbyImageData: GatsbyImageData!
    }
  `);
};

exports.createResolvers = ({ createResolvers, reporter, cache }) => {
  createResolvers({
    ProductImage: {
      gatsbyImageData: getGatsbyImageResolver((image, options, _context, _info) => 
        resolveGatsbyImageData(image, options, _context, _info, { reporter, cache }),
      {
        quality: 'Int',
      })
    }
  });
};

exports.sourceNodes = async ({ actions, createNodeId, createContentDigest, reporter }) => {
  const { createNode } = actions;

  try {
    const response = await fetch(process.env.ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TOKEN}`
      },
      body: JSON.stringify({
        query: `
          query {
            products {
              name
              images {
                url
                fileName
                width
                height
                handle
                mimeType
              }
            }
          }
        `,
      }),
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    };

    const result = await response.json();

    if (result.errors) {
      reporter.panicOnBuild(new Error(`Error while fetching data from GraphQL: ${result.errors}`));
      return;
    };

    const data = result.data;

    for (const product of data.products) {
      for (const image of product.images) {
        const imageNode = {
          id: createNodeId(`ProductImage-${image.handle}`),
          parent: null,
          children: [],
          internal: {
            type: 'ProductImage',
            contentDigest: createContentDigest(image),
          },
          ...image,
        };
        createNode(imageNode);
      };
    };
  } catch (error) {
    reporter.panicOnBuild(new Error(`Error during sourceNodes: ${error.message}`));
  };
};