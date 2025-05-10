'use strict'
Object.defineProperties(exports, {
  __esModule: { value: true },
  [Symbol.toStringTag]: { value: 'Module' },
})
const commonJsonSchemas = require('../utils/common-json-schemas.js')
const reportErrors = require('../utils/report-errors.js')
const validateNewlinesAndPartitionConfiguration = require('../utils/validate-newlines-and-partition-configuration.js')
const validateCustomSortConfiguration = require('../utils/validate-custom-sort-configuration.js')
const validateGroupsConfiguration = require('../utils/validate-groups-configuration.js')
const getEslintDisabledLines = require('../utils/get-eslint-disabled-lines.js')
const isNodeEslintDisabled = require('../utils/is-node-eslint-disabled.js')
const sortNodesByGroups = require('../utils/sort-nodes-by-groups.js')
const createEslintRule = require('../utils/create-eslint-rule.js')
const reportAllErrors = require('../utils/report-all-errors.js')
const shouldPartition = require('../utils/should-partition.js')
const computeGroup = require('../utils/compute-group.js')
const rangeToDiff = require('../utils/range-to-diff.js')
const getSettings = require('../utils/get-settings.js')
const complete = require('../utils/complete.js')
let defaultOptions = {
  fallbackSort: { type: 'unsorted' },
  specialCharacters: 'keep',
  newlinesBetween: 'ignore',
  partitionByNewLine: false,
  partitionByComment: false,
  type: 'alphabetical',
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}
let jsonSchema = {
  properties: {
    ...commonJsonSchemas.commonJsonSchemas,
    partitionByComment: commonJsonSchemas.partitionByCommentJsonSchema,
    partitionByNewLine: commonJsonSchemas.partitionByNewLineJsonSchema,
    newlinesBetween: commonJsonSchemas.newlinesBetweenJsonSchema,
    groups: commonJsonSchemas.groupsJsonSchema,
  },
  additionalProperties: false,
  type: 'object',
}
const sortUnionTypes = createEslintRule.createEslintRule({
  create: context => ({
    TSUnionType: node => {
      sortUnionOrIntersectionTypes({
        availableMessageIds: {
          missedSpacingBetweenMembers: 'missedSpacingBetweenUnionTypes',
          extraSpacingBetweenMembers: 'extraSpacingBetweenUnionTypes',
          unexpectedGroupOrder: 'unexpectedUnionTypesGroupOrder',
          unexpectedOrder: 'unexpectedUnionTypesOrder',
        },
        tokenValueToIgnoreBefore: '|',
        context,
        node,
      })
    },
  }),
  meta: {
    messages: {
      missedSpacingBetweenUnionTypes: reportErrors.MISSED_SPACING_ERROR,
      extraSpacingBetweenUnionTypes: reportErrors.EXTRA_SPACING_ERROR,
      unexpectedUnionTypesGroupOrder: reportErrors.GROUP_ORDER_ERROR,
      unexpectedUnionTypesOrder: reportErrors.ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-union-types',
      description: 'Enforce sorted union types.',
      recommended: true,
    },
    schema: [jsonSchema],
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-union-types',
})
let sortUnionOrIntersectionTypes = ({
  tokenValueToIgnoreBefore,
  availableMessageIds,
  context,
  node,
}) => {
  let settings = getSettings.getSettings(context.settings)
  let options = complete.complete(
    context.options.at(0),
    settings,
    defaultOptions,
  )
  validateCustomSortConfiguration.validateCustomSortConfiguration(options)
  validateGroupsConfiguration.validateGroupsConfiguration({
    allowedPredefinedGroups: [
      'intersection',
      'conditional',
      'function',
      'operator',
      'keyword',
      'literal',
      'nullish',
      'unknown',
      'import',
      'object',
      'named',
      'tuple',
      'union',
    ],
    allowedCustomGroups: [],
    options,
  })
  validateNewlinesAndPartitionConfiguration.validateNewlinesAndPartitionConfiguration(
    options,
  )
  let { sourceCode, id } = context
  let eslintDisabledLines = getEslintDisabledLines.getEslintDisabledLines({
    ruleName: id,
    sourceCode,
  })
  let formattedMembers = node.types.reduce(
    (accumulator, type) => {
      let predefinedGroups = []
      switch (type.type) {
        case 'TSTemplateLiteralType':
        case 'TSLiteralType':
          predefinedGroups.push('literal')
          break
        case 'TSIndexedAccessType':
        case 'TSTypeReference':
        case 'TSQualifiedName':
        case 'TSArrayType':
        case 'TSInferType':
          predefinedGroups.push('named')
          break
        case 'TSIntersectionType':
          predefinedGroups.push('intersection')
          break
        case 'TSUndefinedKeyword':
        case 'TSNullKeyword':
        case 'TSVoidKeyword':
          predefinedGroups.push('nullish')
          break
        case 'TSConditionalType':
          predefinedGroups.push('conditional')
          break
        case 'TSConstructorType':
        case 'TSFunctionType':
          predefinedGroups.push('function')
          break
        case 'TSBooleanKeyword':
        case 'TSUnknownKeyword':
        case 'TSBigIntKeyword':
        case 'TSNumberKeyword':
        case 'TSObjectKeyword':
        case 'TSStringKeyword':
        case 'TSSymbolKeyword':
        case 'TSNeverKeyword':
        case 'TSAnyKeyword':
        case 'TSThisType':
          predefinedGroups.push('keyword')
          break
        case 'TSTypeOperator':
        case 'TSTypeQuery':
          predefinedGroups.push('operator')
          break
        case 'TSTypeLiteral':
        case 'TSMappedType':
          predefinedGroups.push('object')
          break
        case 'TSImportType':
          predefinedGroups.push('import')
          break
        case 'TSTupleType':
          predefinedGroups.push('tuple')
          break
        case 'TSUnionType':
          predefinedGroups.push('union')
          break
      }
      let group = computeGroup.computeGroup({
        predefinedGroups,
        options,
      })
      let lastGroup = accumulator.at(-1)
      let lastSortingNode = lastGroup == null ? void 0 : lastGroup.at(-1)
      let sortingNode = {
        isEslintDisabled: isNodeEslintDisabled.isNodeEslintDisabled(
          type,
          eslintDisabledLines,
        ),
        size: rangeToDiff.rangeToDiff(type, sourceCode),
        name: sourceCode.getText(type),
        node: type,
        group,
      }
      if (
        shouldPartition.shouldPartition({
          tokenValueToIgnoreBefore,
          lastSortingNode,
          sortingNode,
          sourceCode,
          options,
        })
      ) {
        lastGroup = []
        accumulator.push(lastGroup)
      }
      lastGroup == null ? void 0 : lastGroup.push(sortingNode)
      return accumulator
    },
    [[]],
  )
  for (let nodes of formattedMembers) {
    let sortNodesExcludingEslintDisabled = ignoreEslintDisabledNodes =>
      sortNodesByGroups.sortNodesByGroups({
        getOptionsByGroupNumber: () => ({ options }),
        ignoreEslintDisabledNodes,
        groups: options.groups,
        nodes,
      })
    reportAllErrors.reportAllErrors({
      sortNodesExcludingEslintDisabled,
      availableMessageIds,
      sourceCode,
      options,
      context,
      nodes,
    })
  }
}
exports.default = sortUnionTypes
exports.jsonSchema = jsonSchema
exports.sortUnionOrIntersectionTypes = sortUnionOrIntersectionTypes
