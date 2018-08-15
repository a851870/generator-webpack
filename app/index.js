'use strict';
const Generator = require('yeoman-generator')
const _ = require('lodash');
const chalk = require('chalk')

const Path = require('path')

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    // current选项代表是否在当前目录文件夹中创建项目
    this.option('current', {
      desc: 'generate app in current folder',
      type: Boolean,
      alias: 'c',
      required: false,
      default: false
    });
  }

  initializing() {
    // 打印欢迎语
    this.log(
      `Welcome to the shining generator!`
    )
  }

  prompting() {
    const prompts = [
      {
        type: 'input',
        name: 'appname',
        message: 'Your project name',
        default : this.appname // Default to current folder name
      },
      {
        type: 'list',
        name: 'templateType',
        message: 'Which template would you like to generate:',
        choices: [{
          name: 'webpack',
          value: 'webpack'
        }],
        default: 0
      },
      {
        type: 'list',
        name: 'framework',
        message: 'Select the framework you want to install',
        choices: [{
          name: 'no',
          value: 'no'
        },{
          name: 'vue',
          value: 'vue'
        }],
        default: 0
      },
      {
        type: 'list',
        name: 'compiler',
        message: 'Select the compiler you want to install',
        choices: [{
          name: 'css',
          value: 'css'
        },{
          name: 'sass',
          value: 'sass'
        }],
        default: 0
      }
    ]


    return this.prompt(prompts).then(res => {
      let pkgArray = [], pkgDep = []
      let appname = res.appname || this.appname;
      let options = Object.assign({}, res, {
        appname
      })

      switch (res.templateType) {
        case 'webpack':
          pkgArray = ['webpack', 'webpack-cli', 'webpack-dev-server']
          break
      }

      pkgArray = pkgArray.concat(['css-loader', 'style-loader', 'url-loader', 'vue-loader']).
        concat(['html-webpack-plugin', 'clean-webpack-plugin', 'webpack-merge']).
        concat(['babel-loader', 'babel-core', 'babel-preset-env']).
        concat(['babel-polyfill', 'whatwg-fetch', 'babel-plugin-transform-runtime', 'babel-runtime']).
        concat(['mini-css-extract-plugin', 'uglifyjs-webpack-plugin'])

      switch (res.framework) {
        case 'no':
          break
        case 'vue':
          pkgDep = ['vue@2.5.16', 'vuex', 'vue-router', 'vue-template-compiler@2.5.16']
          break
      }

      switch (res.compiler) {
        case 'css':
          break
        case 'sass':
          pkgArray = pkgArray.concat(['sass-loader', 'node-sass'])
          break
      }
      this.pkg = pkgArray
      this.pkgDep = pkgDep
      this.renderOpts = options
    });
  }
  
  writing() {
    this._renderTpl(this.renderOpts);
  }

  install() {
    if (this.pkg.length === 0 && this.pkgDep.length === 0) {
      return;
    }
    if (!this.options.current) {
      process.chdir(Path.join(process.cwd(), this.renderOpts.appname));
    }
    this._npmInstall(this.pkg);
    if (this.pkgDep.length != 0) {
      this._npmInstallPkgDep(this.pkgDep);
    }
  }

  /**
   * @method
   * @private
   * @desc 绘制文件
   * @param  {object} opts 需安装的node模块对象
   */
  _renderTpl(opts) {
    const DestFolder = this.options.current ? "" : Path.join(opts.appname, '/');
    // 生成package.json文件
    this.fs.copyTpl(
      this.templatePath('webpack/package.ejs'),
      this.destinationPath(Path.join(DestFolder, 'package.json')),
      opts
    );
    this.fs.copyTpl(
      this.templatePath('webpack/index.ejs'),
      this.destinationPath(Path.join(DestFolder, 'index.html')),
      opts
    );
    this.fs.copyTpl(
      this.templatePath('webpack/build/webpack.base.ejs'),
      this.destinationPath(Path.join(DestFolder, 'build', 'webpack.base.js')),
      opts
    );
    this.fs.copy(
      this.templatePath('webpack/build/config.js'),
      this.destinationPath(Path.join(DestFolder, 'build', 'config.js'))
    );
    this.fs.copyTpl(
      this.templatePath('webpack/build/webpack.dev.ejs'),
      this.destinationPath(Path.join(DestFolder, 'build', 'webpack.dev.js')),
      opts
    );
    this.fs.copyTpl(
      this.templatePath('webpack/build/webpack.prod.ejs'),
      this.destinationPath(Path.join(DestFolder, 'build',  'webpack.prod.js')),
      opts
    );
    
    this.fs.copy(
      this.templatePath('webpack/public/polyfills.js'),
      this.destinationPath(Path.join(DestFolder, 'public', 'polyfills.js'))
    );
    this.fs.copy(
      this.templatePath('webpack/.babelrc'),
      this.destinationPath(Path.join(DestFolder, '.babelrc'))
    );
    switch (opts.framework) {
      case 'no': 
        this._renderNoTpl(DestFolder, opts)
        break
      case 'vue':
        this._renderVueTpl(DestFolder, opts)
    }
  }

  _renderNoTpl(dor, opts) {
    this.fs.copy(
      this.templatePath('webpack/src/index.js'),
      this.destinationPath(Path.join(dor, 'src', 'index.js'))
    );
  }

  _renderVueTpl(dor, opts) {
    this.fs.copy(
      this.templatePath('vue/main.js'),
      this.destinationPath(Path.join(dor, 'src', 'main.js'))
    );
    this.fs.copy(
      this.templatePath('vue/App.vue'),
      this.destinationPath(Path.join(dor, 'src', 'App.vue'))
    );
    this.fs.copy(
      this.templatePath('vue/components/HelloWorld.vue'),
      this.destinationPath(Path.join(dor, 'src', 'components', 'HelloWorld.vue'))
    );
    this.fs.copy(
      this.templatePath('vue/router/index.js'),
      this.destinationPath(Path.join(dor, 'src', 'router', 'index.js'))
    );
    this.fs.copy(
      this.templatePath('vue/assets/**/*'),
      this.destinationPath(Path.join(dor, 'src', 'assets'))
    );
  }
  /**
   * @method
   * @private
   * @desc 安装node模块
   * @param  {Array} modules 需安装的node模块数组
   */
  _npmInstall(modules) {
    if (modules && _.isArray(modules) && modules.length > 0) {
      this.npmInstall(modules, {
        'save-dev': true,
        'skipMessage': true
      });
    }
  }

  _npmInstallPkgDep(modules) {
    if (modules && _.isArray(modules) && modules.length > 0) {
      this.npmInstall(modules, {
        'save-dev': false
      });
    }
  }
};
