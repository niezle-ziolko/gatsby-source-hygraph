const { getGatsbyImageResolver } = require("gatsby-plugin-image/graphql-utils");
const { generateImageData } = require("gatsby-plugin-image");
const fetch = require("node-fetch");
const sharp = require("sharp");

// Function to generate image URLs
const generateImageSource = (baseURL, width, height, format) => {
  const src = `https://media.graphassets.com/resize=height:${height},width:${width}/output=format:${format}/${baseURL}`;
  return { src, width, height, format };
};

// Function to fetch and convert image to base64
const getBase64Image = async (url) => {
  const response = await fetch(url);
  const buffer = await response.buffer();
  const resizedBuffer = await sharp(buffer)
    .resize({ width: 20 }) // resize to very small width to get low resolution
    .toBuffer();
  return `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
};

// Resolver function to generate image data
const resolveGatsbyImageData = async (image, options) => {
  const sourceMetadata = {
    width: image.width,
    height: image.height,
    format: "webp",
  };

  const imageDataArgs = {
    ...options,
    pluginName: `gatsby-source-example`,
    sourceMetadata,
    filename: image.handle,
    generateImageSource,
  };

  if (options.placeholder === "blurred") {
    const lowResImageURL = `https://media.graphassets.com/resize=height:20,width:20/output=format:webp/${image.handle}`;
    imageDataArgs.placeholderURL = await getBase64Image(lowResImageURL);
  }

  return generateImageData(imageDataArgs);
};

// Create schema customization
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

// Create resolvers to add gatsbyImageData field
exports.createResolvers = ({ createResolvers }) => {
  createResolvers({
    ProductImage: {
      gatsbyImageData: {
        type: 'GatsbyImageData!',
        resolve: async (source, args, context, info) => {
          // Call the resolveGatsbyImageData function directly
          return resolveGatsbyImageData(source, args);
        },
      },
    },
  });
};

// Fetch data and create nodes
exports.sourceNodes = async ({ actions, createNodeId, createContentDigest, reporter }) => {
  const { createNode } = actions;

  try {
    // Fetch data from an external API
    const response = await fetch("https://eu-central-1-shared-euc1-02.cdn.hygraph.com/content/clz6oj6040kuz07uv2g5obvb8/master", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImdjbXMtbWFpbi1wcm9kdWN0aW9uIn0.eyJ2ZXJzaW9uIjozLCJpYXQiOjE3MjIyMzg4ODcsImF1ZCI6WyJodHRwczovL2FwaS1ldS1jZW50cmFsLTEtc2hhcmVkLWV1YzEtMDIuaHlncmFwaC5jb20vdjIvY2x6Nm9qNjA0MGt1ejA3dXYyZzVvYnZiOC9tYXN0ZXIiLCJtYW5hZ2VtZW50LW5leHQuZ3JhcGhjbXMuY29tIl0sImlzcyI6Imh0dHBzOi8vbWFuYWdlbWVudC1ldS1jZW50cmFsLTEtc2hhcmVkLWV1YzEtMDIuaHlncmFwaC5jb20vIiwic3ViIjoiMzY0NzdhMDMtMTAwZS00MjA2LWFhOWUtMTMwNjdiYmVhMDI3IiwianRpIjoiY2xwMDVieHVrMTNqdzAxdWUxajNwYnhpMyJ9.gHPFM_CzbWk0EtBlrfmq8gnrODpv9pNr3DwXMF4CykkjKfvnouujwU-gPI9O2VmL3bXfsYQf75SM9TlsGSqJGu5H2QGsrBVbbx3XF9d2XcvtEMI5T4JCzYv0elE6Yhe4KPYZj9GYLrG2pZmnRAQ6fYsXusU8u8GcZprCJw16BLonW8d0d6v8uaeCoO8mpTp7T7KBqVreL6CeL_kLcIK4zC7bFMzdk8jf3qRjhCxi80v1kXCmVY9riwMrRn_gTXNpnjhCqJS1HKSWuGMxitrDZbkpLm9DK8iMSlesZqvCrEYQbv8YZAbRC2yO6MeBhQUwgOL6yHIWVoeFNmEaj4pGrN-qUBbS__DnHZup8REYOSoj7qy_5X9lsfSk7FN-ckgzNRZ2Wp3eha0_4fzVvQl18Rnwq5AsJZaqpJJGxKywg_uD-IxkzZTaIgsbZM-IWUzlNmkHqDmWZoURJVIA6pcnbgcd8Ld4IgNGJLOA2oFHe0--1V-CVlnxBhP47bkU87aqlpBhW39ScbefTECVZPCtzoyMe7uGidBWbHk6HnVQU3eoJ2HS6l09VOEGGS7rY-1S3YSgMn8hFHoudAzDYDY8fDPL47UU7gW7k3rZu1AZILpg4dywyAOCKQtIggDK8vjjjJPCGIvAaErDMF4SC5P9c3LNAghAl1BTQiKHBCRU56M`
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
      reporter.panicOnBuild(`Error while fetching data from GraphQL: ${result.errors}`);
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
    reporter.panicOnBuild(`Error during sourceNodes: ${error.message}`);
  }
};
