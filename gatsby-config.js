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
      resolve: require.resolve(`./src/plugins/gatsby-source-hygraph`),
      options: {
        endpoint: process.env.ENDPOINT,
        token: process.env.TOKEN,
        assetsPath: '.fragments',
        fragmentsPath: '.assets',
        allowedTypes: [
          'Asset',
          'Category',
          'Content',
          'Currency',
          'Page',
          'PaymentMethod',
          'Producer',
          'Product',
          'ShippingMethod',
          'Slice',
          'Tag',
          'TaxClass',
          'Upsell',
          'User'
        ]
      }
    },
    'gatsby-plugin-image',
    'gatsby-plugin-sharp',
    'gatsby-transformer-sharp'
  ],
};
