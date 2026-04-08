/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

interface SchemaType<T> {
  validate(value: unknown): T;
}
export declare const schema: {
  object(props: Record<string, SchemaType<any>>): SchemaType<any>;
  string(opts?: any): SchemaType<string>;
  number(opts?: any): SchemaType<number>;
  boolean(opts?: any): SchemaType<boolean>;
  maybe(type: SchemaType<any>): SchemaType<any>;
  arrayOf(type: SchemaType<any>): SchemaType<any[]>;
  oneOf(types: SchemaType<any>[]): SchemaType<any>;
  literal(value: any): SchemaType<any>;
};
