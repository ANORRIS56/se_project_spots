const presets = [
  [
    "@babel/preset-env",
    {
      targets: "defaults",
      useBuiltIns: "entry",
      corejs: "3",
    },
  ],
];

module.exports = { presets };
