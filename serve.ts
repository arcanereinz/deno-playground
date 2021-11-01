/*
 * This is an example of a server that will serve static content out of the
 * $CWD/examples/static path.
 * @see https://github.com/oakserver/oak/blob/main/examples/staticServer.ts
 */

/** oak/mod.ts */
import { Application, Router, Context } from './deps.ts';
/** oak/mod.ts */
import type { RouteParams } from './deps.ts';
/** path/posix.ts */
import { extname } from './deps.ts';
/** fmt/colors.ts */
import { bold, yellow } from './deps.ts';

/** Based on file_server.ts */
const MEDIA_TYPES: Record<string, string> = {
  '.md': 'text/markdown',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.json': 'application/json',
  '.map': 'application/json',
  '.txt': 'text/plain',
  '.ts': 'text/typescript',
  '.tsx': 'text/tsx',
  '.js': 'application/javascript',
  '.jsx': 'text/jsx',
  '.gz': 'application/gzip',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.mjs': 'application/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.bmp': 'image/bmp',
  '.jpg': 'image/jpg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

/** Returns the content-type based on the extension of a path. */
function contentType(path: string): string | undefined {
  return MEDIA_TYPES[extname(path)];
}

/**
 * Serve all files from directory (without slash at end) recursively
 * @example serveFilesFrom('./public')
 * @param directory Pathname without slash (/) as end
 */
async function serveFilesFrom(
  router: Router<RouteParams, Record<string, string>>,
  directory: string,
  original = directory
) {
  for await (const dirEntry of Deno.readDir(directory)) {
    if (dirEntry.isDirectory) {
      // recursively add filepath to route
      serveFilesFrom(router, directory + '/' + dirEntry.name, original);
    } else {
      // add filepath to route
      const urlpath =
        '/' +
        (directory + '/').replace(original + '/', '') +
        (dirEntry.name === 'index.html' ? '' : dirEntry.name);
      router.get(urlpath, async (context: Context) => {
        const filepath = directory + '/' + dirEntry.name;
        // get content from defined mime-types
        const type = contentType(filepath);
        context.response.type = type;
        // move file open inside of closure to
        // control lifetime of file handler
        const body = await Deno.readFile(filepath); // open in binary in case images
        context.response.body = body;
      });
    }
  }
}

const router = new Router();
serveFilesFrom(router, 'build');
const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener('listen', ({ hostname, port, serverType }) => {
  console.log(bold('Start listening on ') + yellow(`${hostname}:${port}`));
  console.log(bold('  using HTTP server: ' + yellow(serverType)));
});

await app.listen({ port: 8000 });
