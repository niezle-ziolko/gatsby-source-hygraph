const fs = require('fs');
const path = require('path');
const utils = require('./utils');


async function createFragments(schemaInformation, options) {
  const { fragmentsName = '.fragments' } = options;
  const fragmentsDir = path.resolve(process.cwd(), fragmentsName);

  try {
    if (!fs.existsSync(fragmentsDir)) {
      fs.mkdirSync(fragmentsDir, { recursive: true });
    };

    const files = fs.readdirSync(fragmentsDir);
    files.forEach(file => {
      const filePath = path.join(fragmentsDir, file);

      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      };
    });
  } catch (error) {
    console.error(`Error during catalog preparation ${fragmentsDir}:`, error);
    throw error;
  };

  try {
    schemaInformation.gatsbyNodeTypes.forEach(nodeType => {
      const fragmentName = nodeType.remoteTypeName;
      const fragmentContent = nodeType.queries;

      if (!fragmentName || !fragmentContent) {
        console.warn(`No data available for node type: ${JSON.stringify(nodeType)}`);
        return;
      };

      const filePath = path.join(fragmentsDir, `${fragmentName}.graphql`);

      try {
        const formattedContent = utils.formatFragment(fragmentContent);
        fs.writeFileSync(filePath, formattedContent, 'utf8');
      } catch (writeError) {
        console.error(`Error while saving ${filePath}:`, writeError);
      };
    });

    console.log(`${utils.colors.green}success${utils.colors.reset} ${fragmentsName} created.`);
  } catch (error) {
    console.error('Error while processing fragments:', error);
    throw error;
  };
};

exports.createFragments = createFragments;