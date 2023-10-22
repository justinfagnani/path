# path-module

This is a port of the Node ’path’ module ported to ES2022 and published to npm
as a browser-compatible, standard JavaScript module.

[Documentation](http://nodejs.org/docs/latest/api/path.html)

## Install

```sh
$ npm install path-module
```

## Usage

You should be able to use this package as a replacement for the built-in `path`
package with systems that allow customization of import specifier resolution,
like [standard import maps](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap),
or the Rollup node-resolve plugin.

### Usage with Rollup

You can install this package under the `path` name:

```json
{
  "dependencies": {
    "path": "npm:path-module"
  }
}
```

Then set [`preferbuiltins`](https://www.npmjs.com/package/@rollup/plugin-node-resolve#preferbuiltins)
to `false` so that the npm package is used.

## License

MIT

## Acknowledgements

This repository is forked from https://github.com/jinder/path
