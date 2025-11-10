import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/lib/schema.graphql',
  documents: 'graphql/**/*.graphql',
  generates: {
    'src/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typed-document-node'
      ],
      config: {
        immutableTypes: true,
        enumsAsTypes: true,
        addDocBlocks: false
      }
    }
  }
};

export default config;
