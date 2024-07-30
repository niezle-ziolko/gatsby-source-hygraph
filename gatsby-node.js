const { getGatsbyImageResolver } = require("gatsby-plugin-image/graphql-utils");
const { generateImageData } = require("gatsby-plugin-image");
const fetch = require("node-fetch");


const generateImageSource = (baseURL, width, height, format) => {
  const src = `https://media.graphassets.com/resize=height:${height},width:${width}/output=format:${format}/${baseURL}`;
  return { src, width, height, format };
};

const resolveGatsbyImageData = async (image, options) => {
  const sourceMetadata = {
    width: image.width,
    height: image.height,
    format: "webp",
  };

  const imageDataArgs = {
    ...options,
    pluginName: "gatsby-source-graphql",
    sourceMetadata,
    filename: image.handle,
    generateImageSource,
  };

  return generateImageData(imageDataArgs);
};

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

exports.createResolvers = ({ createResolvers }) => {
  createResolvers({
    ProductImage: {
      gatsbyImageData: getGatsbyImageResolver(resolveGatsbyImageData, {
        quality: "Int",
      }),
    },
  });
};

exports.sourceNodes = async ({ actions, createNodeId, createContentDigest, reporter }) => {
  const { createNode } = actions;

  try {
    const response = await fetch(process.env.ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TOKEN}`
      },
      body: JSON.stringify({
        query: `
          query {
            products {
              name
              images {
                fileName
                handle
                height
                width
                url
              }
            }
          }
        `,
      }),
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      reporter.panicOnBuild(new Error(`Error while fetching data from GraphQL: ${result.errors}`));
      return;
    }

    const data = result.data;

    for (const product of data.products) {
      for (const image of product.images) {
        const imageNode = {
          id: createNodeId(`ProductImage-${image.handle}`),
          parent: null,
          children: [],
          internal: {
            type: "ProductImage",
            contentDigest: createContentDigest(image),
          },
          ...image,
        };
        createNode(imageNode);
      }
    }
  } catch (error) {
    reporter.panicOnBuild(new Error(`Error during sourceNodes: ${error.message}`));
  }
};