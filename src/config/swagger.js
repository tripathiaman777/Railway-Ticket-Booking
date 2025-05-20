import swaggerJSDoc from "swagger-jsdoc";
import dotenv from "dotenv";
dotenv.config();
const DOMAIN = process.env.DOMAIN || `http://localhost:${PORT}`;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Your API Title",
      version: "1.0.0",
      description: "Your API description",
    },
    servers: [
      {
        url: DOMAIN, // Replace with your server URL
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
