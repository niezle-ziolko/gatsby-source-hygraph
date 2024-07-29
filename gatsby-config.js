/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  siteMetadata: {
    title: `Gatsby Plugin`,
    siteUrl: `https://www.yourdomain.tld`,
  },
  plugins: [
    {
      resolve: require.resolve(`./src/plugins/gatsby-source-hygraph`),
      options: {
        endpoint: 'https://eu-central-1-shared-euc1-02.cdn.hygraph.com/content/clz6oj6040kuz07uv2g5obvb8/master',
        token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImdjbXMtbWFpbi1wcm9kdWN0aW9uIn0.eyJ2ZXJzaW9uIjozLCJpYXQiOjE3MjIyMzg4ODcsImF1ZCI6WyJodHRwczovL2FwaS1ldS1jZW50cmFsLTEtc2hhcmVkLWV1YzEtMDIuaHlncmFwaC5jb20vdjIvY2x6Nm9qNjA0MGt1ejA3dXYyZzVvYnZiOC9tYXN0ZXIiLCJtYW5hZ2VtZW50LW5leHQuZ3JhcGhjbXMuY29tIl0sImlzcyI6Imh0dHBzOi8vbWFuYWdlbWVudC1ldS1jZW50cmFsLTEtc2hhcmVkLWV1YzEtMDIuaHlncmFwaC5jb20vIiwic3ViIjoiMzY0NzdhMDMtMTAwZS00MjA2LWFhOWUtMTMwNjdiYmVhMDI3IiwianRpIjoiY2xwMDVieHVrMTNqdzAxdWUxajNwYnhpMyJ9.gHPFM_CzbWk0EtBlrfmq8gnrODpv9pNr3DwXMF4CykkjKfvnouujwU-gPI9O2VmL3bXfsYQf75SM9TlsGSqJGu5H2QGsrBVbbx3XF9d2XcvtEMI5T4JCzYv0elE6Yhe4KPYZj9GYLrG2pZmnRAQ6fYsXusU8u8GcZprCJw16BLonW8d0d6v8uaeCoO8mpTp7T7KBqVreL6CeL_kLcIK4zC7bFMzdk8jf3qRjhCxi80v1kXCmVY9riwMrRn_gTXNpnjhCqJS1HKSWuGMxitrDZbkpLm9DK8iMSlesZqvCrEYQbv8YZAbRC2yO6MeBhQUwgOL6yHIWVoeFNmEaj4pGrN-qUBbS__DnHZup8REYOSoj7qy_5X9lsfSk7FN-ckgzNRZ2Wp3eha0_4fzVvQl18Rnwq5AsJZaqpJJGxKywg_uD-IxkzZTaIgsbZM-IWUzlNmkHqDmWZoURJVIA6pcnbgcd8Ld4IgNGJLOA2oFHe0--1V-CVlnxBhP47bkU87aqlpBhW39ScbefTECVZPCtzoyMe7uGidBWbHk6HnVQU3eoJ2HS6l09VOEGGS7rY-1S3YSgMn8hFHoudAzDYDY8fDPL47UU7gW7k3rZu1AZILpg4dywyAOCKQtIggDK8vjjjJPCGIvAaErDMF4SC5P9c3LNAghAl1BTQiKHBCRU56M',
        queryConcurrency: 1
      }
    }
  ]
}
