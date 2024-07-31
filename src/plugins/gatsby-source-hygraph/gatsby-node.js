const { getGatsbyImageResolver } = require("gatsby-plugin-image/graphql-utils");
const { getPluginOptions, doMergeDefaults } = require("gatsby-plugin-sharp/plugin-options");
const { generateImageData, getLowResolutionImageURL } = require("gatsby-plugin-image");
const { fetchRemoteFile } = require("gatsby-core-utils/fetch-remote-file");
const { getDominantColor } = require("gatsby-plugin-sharp");
const fetch = require("node-fetch");
const path = require("path");


function generateImageSource(handle, width, height, format, fit, options) {
  if (!Number.isFinite(height))
    height = width;
  
  const args = ["https://media.graphassets.com"];
    
  if (width || height) {
    let filestackFit = "crop";
      switch (fit) {
      case "contain":
        filestackFit = "clip";
      break;

      case "fill":
      case "inside":
      case "outside":
      case "cover":
        filestackFit = "crop";
      break;
    };
      
    args.push(`resize=${Number.isFinite(width) && width > 0 ? `w:${width},` : ""}${Number.isFinite(height) && height > 0 ? `h:${height},` : ""}${options?.align ? `a:${options.align},` : ""}${options?.filter ? `ft:${options.filter},` : ""}f:${filestackFit}`);
  };

  if (options?.crop) {
    args.push(`crop=d:${options.crop}`);
  };

  let filestackFormat;
  switch (format) {
    case "auto":
      filestackFormat = "auto";
      args.push("auto_image");
    break;

    case "avif":
    case "webp":
      filestackFormat = "webp";
      args.push("output=f:webp");
    break;

    case "jpg":
      filestackFormat = "jpg";
      args.push("output=f:jpg");
    break;

    default:
      filestackFormat = "png";
      args.push("output=f:png");
    break;
  };

  args.push(handle);
  const src = args.join("/");
    
  return { width, height, format: filestackFormat, src };
};

function isImage(mimeType) {
  return mimeType.startsWith("image/") && mimeType.indexOf("/svg") === -1;
};

function getBase64DataURI(imageBase64) {
  return `data:image/png;base64,${imageBase64}`;
};

async function resolveGatsbyImageData(image, options, _context, _info, { reporter, cache }) {
  if (!isImage(image.mimeType))
    return null;

  let format = image.mimeType.split("/")[1];
  if (format === "jpeg") {
    format = "jpg";
  };

  const sourceMetadata = {
    width: image.width,
    height: image.height,
    format: format
  };

  const sharpOptions = getPluginOptions();
  const userDefaults = sharpOptions.defaults;
  const defaults = {
    tracedSVGOptions: {},
    blurredOptions: {},
    jpgOptions: {},
    pngOptions: {},
    webpOptions: {},
    gifOptions: {},
    avifOptions: {},
    quality: 50,
    placeholder: `dominantColor`,
    ...userDefaults,
  };
    
  options = doMergeDefaults(options, defaults);
  
  if (options.placeholder && options.placeholder === "tracedSVG") {
    if (!haveWarnedAboutPlaceholder) {
      reporter.warn("Does not support tracedSVG");
      haveWarnedAboutPlaceholder = true;
    };

    options.placeholder = "dominantColor";
  };

  const imageDataArgs = {
    ...options,
    pluginName: "gatsby-source-hygraph",
    sourceMetadata,
    filename: image.handle,
    generateImageSource,
    options
  };

  const imageData = (0, generateImageData)(imageDataArgs);
  if (
    options.placeholder === "blurred" ||
    options.placeholder == "dominantColor"
  ) {
    const lowResImageUrl = (0, getLowResolutionImageURL)(imageDataArgs, 20);
    const filePath = await (0, fetchRemoteFile)({
      url: lowResImageUrl,
      name: image.handle,
      directory: cache.directory,
      ext: (0, path.extname)(image.fileName),
      cacheKey: image.internal.contentDigest,
    });

    if (options.placeholder === "blurred") {
      const buffer = await (0, promises_1.readFile)(filePath);
      const base64 = buffer.toString("base64");
      
      imageData.placeholder = {
        fallback: getBase64DataURI(base64),
      };
    } else {
      imageData.backgroundColor = await (0, getDominantColor)(filePath);
    };
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

exports.createResolvers = ({ createResolvers, reporter, cache }) => {
  createResolvers({
    ProductImage: {
      gatsbyImageData: getGatsbyImageResolver((image, options, _context, _info) => 
        resolveGatsbyImageData(image, options, _context, _info, { reporter, cache }),
      {
        quality: "Int",
      })
    }
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
            type: "ProductImage",
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