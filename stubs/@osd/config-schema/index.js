/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Stub for @osd/config-schema — at runtime, OSD provides the real implementation.
// This stub allows the plugin to be installed (require resolves) but the actual
// schema validation is performed by OSD's config-schema module.
const identity = () => identity;
identity.validate = (v) => v;

exports.schema = {
  object: (props) => ({ validate: (v) => v, ...props }),
  string: () => identity,
  number: () => identity,
  boolean: () => identity,
  maybe: (type) => type,
  arrayOf: (type) => identity,
  oneOf: (types) => identity,
  literal: (value) => identity,
};
