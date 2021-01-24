module.exports = {
  stories: ["../modules/client/**/*.stories.(tsx|mdx)"],
  addons: [
    "@storybook/addon-actions/register",
    "@storybook/addon-viewport/register",
    "@storybook/addon-knobs/register",
  ],
};