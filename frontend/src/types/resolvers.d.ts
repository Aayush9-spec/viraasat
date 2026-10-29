import { Resolver } from 'react-hook-form';
import { z } from 'zod';

declare module '@hookform/resolvers/zod' {
  export function zodResolver<T extends z.ZodTypeAny>(
    schema: T,
    schemaOptions?: any,
    resolverOptions?: any
  ): Resolver<z.infer<T>>;
}

