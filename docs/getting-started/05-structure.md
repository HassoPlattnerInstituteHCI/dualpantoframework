# [Getting Started](README.md) - Step 5
## The structure of your project

This is the basic structure of every javascript project:
```
.git/              # git stuff
lib/               # all javascript code
- your-project.js  # the main js file
.gitignore         # what git should ignore
index.js           # see below
node_modules       # downloaded dependencies
package-lock.json  # managed by npm (don't care about it)
package.json       # the specification of your package
```

### `index.js`
Now create the `index.js` file. It should only load the actual main file:
```js
'use strict';

module.exports = require('./lib/your-project.js');
```

### `lib/your-project.js`
Now create your first actual code in `lib/your-project.js`:
```js
'use strict';

console.log('Hello World!');
```

### Test it
When your are in the root directory of your project (i.e. not in `lib/`), run `node .` to run the program in the current directory (i.e. your program):
```sh
node .
Hello World!
```

Next: [Step 6 - Hello World](06-hello-world.md)
