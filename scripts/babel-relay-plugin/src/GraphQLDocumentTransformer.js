/*jslint node:true*/
"use strict";

var assert = require('assert');
var formatError = require('graphql/error').formatError;
var GraphQLPrinter = require('./GraphQLPrinter');
var parser = require('graphql/language/parser');
var Source = require('graphql/language/source').Source;
var validate = require('graphql/validation/validate').validate;
var util = require('util');

function GraphQLDocumentTransformer2(schema /*: GraphQLSchema */) {
  this.schema = schema;
}

GraphQLDocumentTransformer2.prototype.transformQuery = function(
  queryAndSubstitutions,
  documentName, /*: string */
  tagName /*: string */
) /*: string */ {
  var queryDocument =
    this.parseDocument(queryAndSubstitutions.text, documentName);
  var printer = new GraphQLPrinter(this.schema, tagName);
  return printer.getCode(queryDocument, queryAndSubstitutions.substitutions);
};

GraphQLDocumentTransformer2.prototype.parseDocument = function(
  query, /*: string */
  documentName /*: string */
) /*: string */ {
  var match = /^(fragment|mutation|query)\s*(\w*)?([\s\S]*)/.exec(query)
  assert(
    match,
    util.format(
      'GraphQL: expected query `%s...` to start with a document type. ' +
      'Specify `fragment`, `mutation`, or `query`.',
      query.substr(0, 20)
    )
  );
  var type = match[1];
  var name = match[2] || documentName;
  var rest = match[3];

  if (type === 'fragment' && name === 'on') {
    // Allow `fragment on User {...}`
    rest = 'on' + rest;
    name = documentName;
  }

  name = this.getName(name);
  var queryText = type + ' ' + name + ' ' + rest;
  return parse(type, queryText, this.schema).definitions[0];
};

GraphQLDocumentTransformer2.prototype.getName = function(
  documentName /*: string */
) /*: string */ {
  if (!documentName || !documentName.length) {
    throw new Error(
      'GraphQLDocumentTransformer: expected document to have a name.'
    );
  }
  return documentName[0].toUpperCase() + documentName.slice(1);
};

/**
 * Parses a query document into an AST, returning the AST plus any validation
 * errors.
 */
function parse(
  type, /*: string */
  text, /*: string */
  schema /*: GraphQLSchema */
) /*: any */ {
  var source = new Source(text, 'GraphQL Document');
  var documentAST = parser.parse(source);
  var rules = [
    require('graphql/validation/rules/ArgumentsOfCorrectType'),
    require('graphql/validation/rules/DefaultValuesOfCorrectType'),
    require('graphql/validation/rules/FieldsOnCorrectType'),
    require('graphql/validation/rules/FragmentsOnCompositeTypes'),
    require('graphql/validation/rules/KnownArgumentNames'),
    require('graphql/validation/rules/KnownTypeNames'),
    require('graphql/validation/rules/PossibleFragmentSpreads'),
    require('graphql/validation/rules/PossibleFragmentSpreads'),
    require('graphql/validation/rules/VariablesInAllowedPosition'),
  ];
  if (type !== 'mutation') {
    rules.push(require('graphql/validation/rules/ProvidedNonNullArguments'));
  }
  var validationErrors = validate(schema, documentAST, rules);
  if (validationErrors && validationErrors.length > 0) {
    validationErrors = validationErrors.map(formatError);
    var error = new Error('This document is invalid');
    error.validationErrors = validationErrors;
    error.sourceText = text;
    throw error;
  }
  return documentAST;
}

module.exports = GraphQLDocumentTransformer2;
