const path = require('path')

module.exports = (api, projectOptions) => {
  /*
  api.configureWebpack(webpackConfig => {
    let config = {
      module: {
        rules: [
          {
            test: /vue\.(blui|js)$/,
            use: [
              {
                loader: path.resolve(__dirname, 'vue-blui-js-loader.js')
              },
              {
                loader: path.resolve(__dirname, 'vue-blui-loader.js')
              }
            ]
          }
        ]
      }
    }
    return config;
  })
  */

  api.chainWebpack(config => {
    config.module
      .rule('blui')
      .test(/\.vue$/)
      .use('vue-blui-loader')
        .loader(path.resolve(__dirname, 'vue-blui-loader.js'))
        .end()
  })
}
