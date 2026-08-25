import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import { dirname } from 'path';




const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hazuki Quilín API',
      version: '2.0.0',
      description: 'API REST para el restaurante Hazuki Quilín. Sistema de reservaciones, productos, descuentos y panel administrativo.',
      contact: {
        name: 'Hazuki Quilín Support',
        email: 'info@hazuki.cl'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.hazuki.cl',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            username: { type: 'string' },
            is_admin: { type: 'boolean' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            image_url: { type: 'string' },
            category_id: { type: 'number' }
          }
        },
        Discount: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            title: { type: 'string' },
            percentage: { type: 'number' },
            start_date: { type: 'string', format: 'date' },
            end_date: { type: 'string', format: 'date' },
            start_time: { type: 'string', format: 'time' },
            end_time: { type: 'string', format: 'time' },
            is_active: { type: 'boolean' },
            auto_apply: { type: 'boolean' },
            status: { type: 'string', enum: ['programmed', 'active', 'expired', 'cancelled'] }
          }
        },
        Reservation: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            email: { type: 'string' },
            date: { type: 'string', format: 'date' },
            time: { type: 'string', format: 'time' },
            people: { type: 'number' },
            details: { type: 'string' },
            qr_code: { type: 'string' }
          }
        }
      }
    },
    security: []
  },
  apis: [`${__dirname}/swagger-routes.ts`]
};

export const specs = swaggerJsdoc(options);
