// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

const isObject = (o: unknown): o is object =>
  o !== null && typeof o === 'object';
const isString = (x: string): x is string => typeof x === 'string';

// resolves . and .. elements in a path array with directory names there
// must be no slashes or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
const normalizeArray = (parts: Array<string>, allowAboveRoot?: boolean) => {
  const res = [];
  for (const p of parts) {
    // ignore empty parts
    if (!p || p === '.') {
      continue;
    }

    if (p === '..') {
      if (res.length && res[res.length - 1] !== '..') {
        res.pop();
      } else if (allowAboveRoot) {
        res.push('..');
      }
    } else {
      res.push(p);
    }
  }

  return res;
};

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
const splitPathRe =
  /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;

const posixSplitPath = (filename: string) =>
  splitPathRe.exec(filename)!.slice(1);

const getCwd = (): string => {
  // @ts-expect-error
  return typeof process !== 'undefined' ? process.cwd() : '/';
};

// path.resolve([from ...], to)
// posix version
export const resolve = (...args: Array<string>) => {
  let resolvedPath = '';
  let resolvedAbsolute = false;

  for (let i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    const path = i >= 0 ? args[i] : getCwd();

    // Skip empty and invalid entries
    if (!isString(path)) {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(
    resolvedPath.split('/'),
    !resolvedAbsolute,
  ).join('/');

  return (resolvedAbsolute ? '/' : '') + resolvedPath ?? '.';
};

// path.normalize(path)
// posix version
export const normalize = (path: string) => {
  const absolute = isAbsolute(path),
    trailingSlash = path.substr(-1) === '/';

  // Normalize the path
  path = normalizeArray(path.split('/'), !absolute).join('/');

  if (!path && !absolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (absolute ? '/' : '') + path;
};

// posix version
export const isAbsolute = (path: string) => {
  return path.charAt(0) === '/';
};

// posix version
export const join = (...args: Array<string>) => {
  let path = '';
  for (const segment of args) {
    if (!isString(segment)) {
      throw new TypeError('Arguments to path.join must be strings');
    }
    if (segment) {
      if (!path) {
        path += segment;
      } else {
        path += '/' + segment;
      }
    }
  }
  return normalize(path);
};

// path.relative(from, to)
// posix version
export const relative = (from: string, to: string) => {
  from = resolve(from).substring(1);
  to = resolve(to).substring(1);

  const trim = (arr: Array<string>) => {
    let start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    let end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end + 1);
  };

  const fromParts = trim(from.split('/'));
  const toParts = trim(to.split('/'));

  const length = Math.min(fromParts.length, toParts.length);
  let samePartsLength = length;
  for (let i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  let outputParts = [];
  for (let i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

// const _makeLong = (path: string) => {
//   return path;
// };

export const dirname = (path: string) => {
  const result = posixSplitPath(path);
  const root = result[0];
  let dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};

export const basename = (path: string, ext?: string) => {
  let f = posixSplitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

export const extname = (path: string) => {
  return posixSplitPath(path)[3];
};

interface Path {
  root: string;
  dir: string;
  base: string;
  ext: string;
  name: string;
}

export const format = (pathObject: Path) => {
  if (!isObject(pathObject)) {
    throw new TypeError(
      "Parameter 'pathObject' must be an object, not " + typeof pathObject,
    );
  }

  const root = pathObject.root ?? '';

  if (!isString(root)) {
    throw new TypeError(
      "'pathObject.root' must be a string or undefined, not " +
        typeof pathObject.root,
    );
  }

  const dir = pathObject.dir ? pathObject.dir + sep : '';
  const base = pathObject.base ?? '';
  return dir + base;
};

export const parse = (pathString: string): Path => {
  if (!isString(pathString)) {
    throw new TypeError(
      "Parameter 'pathString' must be a string, not " + typeof pathString,
    );
  }
  const allParts = posixSplitPath(pathString);
  if (!allParts || allParts.length !== 4) {
    throw new TypeError("Invalid path '" + pathString + "'");
  }
  allParts[1] = allParts[1] ?? '';
  allParts[2] = allParts[2] ?? '';
  allParts[3] = allParts[3] ?? '';

  return {
    root: allParts[0],
    dir: allParts[0] + allParts[1].slice(0, allParts[1].length - 1),
    base: allParts[2],
    ext: allParts[3],
    name: allParts[2].slice(0, allParts[2].length - allParts[3].length),
  };
};

export const sep = '/';
export const delimiter = ':';
