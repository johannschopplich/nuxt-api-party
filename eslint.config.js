import antfu from '@antfu/eslint-config'

export default await antfu({
  rules: {
    'node/prefer-global/buffer': 'off',
    'node/prefer-global/process': 'off',
  },
})
