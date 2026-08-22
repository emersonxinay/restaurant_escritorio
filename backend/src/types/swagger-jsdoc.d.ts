declare module 'swagger-jsdoc' {
  interface SwaggerOptions {
    definition: any;
    apis: string[];
  }

  function swaggerJsdoc(options: SwaggerOptions): any;

  export default swaggerJsdoc;
}
