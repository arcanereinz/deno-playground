import { Router, Context, Application, RouteParams, extname } from './deps.ts';

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

        const type = contentType(filepath);
        context.response.type = type;

        // move file open inside of closure to
        // control lifetime of file handler
        const file = type?.startsWith('image')
          ? await Deno.open(filepath) // open image alternatively since binary
          : await Deno.readTextFile(filepath);
        context.response.body = file;
      });
    }
  }
}

const router = new Router();
serveFilesFrom(router, 'build');
// const body = await Deno.readTextFile('build/_app/chunks/vendor-836cc791.js');
// router.get('/_app/chunks/vendor-836cc791.js', (context: Context) => {
//   context.response.type = 'text/javascript';
//   context.response.body = body;
// });
const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

console.log('Listening on http://localhost:8000');

await app.listen({ port: 8000 });
