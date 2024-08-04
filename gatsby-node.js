const fs = require('fs');
const path = require('path');

let gatsbyNodeModules = fs.realpathSync('node_modules/gatsby');
gatsbyNodeModules = path.resolve(gatsbyNodeModules, '..');


exports.onCreateWebpackConfig = ({ actions }) => {
  actions.setWebpackConfig({
    resolve: {
      modules: [gatsbyNodeModules, 'node_modules']
    }
  });
};