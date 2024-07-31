import React from "react"
import { graphql } from "gatsby"
import { GatsbyImage, getImage } from "gatsby-plugin-image"

const IndexPage = ({ data }) => {
  const images = data.allProductImage.nodes
  console.log(images)

  return (
    <div>
      <h1>Product Images</h1>
      <div>
        {images.map(image => {
          const img = getImage(image.gatsbyImageData)
          if (!img) {
            console.warn(`Image data not found for image with handle: ${image.handle}`)
            return null
          }
          return (
            <div key={image.handle} style={{ marginBottom: "20px" }}>
              <GatsbyImage
                image={img}
                alt={image.fileName}
                style={{ border: "1px solid #ccc" }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const query = graphql`
  query {
    allProductImage {
      nodes {
        handle
        fileName
        gatsbyImageData
      }
    }
  }
`

export default IndexPage;