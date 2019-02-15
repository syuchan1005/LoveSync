module.exports = {
  devServer: {
    disableHostCheck: true,
  },
  pwa: {
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: 'src/service-worker.js',
      swDest: 'service-worker.js',
    },
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black-translucent',
    name: 'LoveSync',
    themeColor: '#FF4081',
    msTileColor: '#FF4081',
  },
};
