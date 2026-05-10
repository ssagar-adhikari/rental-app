// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactNativeA11y = require('eslint-plugin-react-native-a11y');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    plugins: {
      'react-native-a11y': reactNativeA11y,
    },
    rules: {
      // Validity: wrong prop values are bugs — fail the build.
      'react-native-a11y/has-valid-accessibility-role': 'error',
      'react-native-a11y/has-valid-accessibility-state': 'error',
      'react-native-a11y/has-valid-accessibility-actions': 'error',
      'react-native-a11y/has-valid-accessibility-value': 'error',
      'react-native-a11y/no-nested-touchables': 'error',
      // Coverage: warn about missing descriptors/labels — surface during the
      // audit pass without blocking unrelated work.
      'react-native-a11y/has-valid-accessibility-descriptors': 'warn',
      'react-native-a11y/has-accessibility-props': 'warn',
    },
  },
]);
