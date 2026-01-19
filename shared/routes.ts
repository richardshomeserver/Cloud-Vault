
import { z } from 'zod';
import { insertUserSchema, insertItemSchema, items } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register',
      input: insertUserSchema,
      responses: {
        201: z.object({ id: z.number(), username: z.string() }),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.object({ id: z.number(), username: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.object({ id: z.number(), username: z.string(), displayName: z.string().nullable() }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  items: {
    list: {
      method: 'GET' as const,
      path: '/api/items',
      input: z.object({
        parentId: z.string().optional(), // "root" or ID
        category: z.enum(['all', 'recent', 'starred', 'trash']).optional(),
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof items.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    createFolder: {
      method: 'POST' as const,
      path: '/api/items/folder',
      input: z.object({
        name: z.string().min(1),
        parentId: z.number().nullable(),
      }),
      responses: {
        201: z.custom<typeof items.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    // Upload is handled via FormData, input schema defines metadata
    upload: {
      method: 'POST' as const,
      path: '/api/items/upload',
      // Body is FormData with 'file' and 'parentId'
      responses: {
        201: z.custom<typeof items.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/items/:id',
      input: z.object({
        name: z.string().optional(),
        parentId: z.number().nullable().optional(),
        isStarred: z.boolean().optional(),
        isTrashed: z.boolean().optional(),
      }),
      responses: {
        200: z.custom<typeof items.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/items/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    breadcrumb: {
      method: 'GET' as const,
      path: '/api/items/:id/breadcrumb',
      responses: {
        200: z.array(z.object({ id: z.number(), name: z.string() })),
        404: errorSchemas.notFound,
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
