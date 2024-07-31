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
      resolve: 'gatsby-source-graphql',
      options: {
        typeName: 'GQL',
        fieldName: 'graphql',
        url: `${process.env.ENDPOINT}`,
        headers: {
          Authorization: `Bearer ${process.env.TOKEN}`,
        },
        fetchOptions: {}
      },
    },
    {
      resolve: require.resolve(`./src/plugins/gatsby-source-hygraph`)
    },
    'gatsby-plugin-image',
    'gatsby-plugin-sharp',
    'gatsby-transformer-sharp'
  ],
};
