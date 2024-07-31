/**
 * @type {import('gatsby').GatsbyConfig}
 */
require('dotenv').config({
  path: 'wrangler.toml'
})

module.exports = {
  siteMetadata: {
    title: 'My Gatsby Site',
  },
  plugins: [
    {
      resolve: require.resolve(`./src/plugins/gatsby-source-hygraph`)
    },
    'gatsby-plugin-image',
    'gatsby-plugin-sharp',
    'gatsby-transformer-sharp'
  ],
};
