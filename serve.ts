import { Router, Context, Application, RouteParams } from './deps.ts';

/**
 * Serve all files from directory (without slash at end) recursively
 * @example serveFilesFrom('./public')
 * @param directory Pathname without slash (/) as end
 */
async function serveFilesFrom(
  router: Router<RouteParams, Record<string, string>>,
  directory: string,
) {
  for await (const dirEntry of Deno.readDir(directory)) {
    if (dirEntry.isDirectory) {
      // recursively add filepath to route
      serveFilesFrom(router, directory + '/' + dirEntry.name);
    } else {
      // add filepath to route
      let type: string | undefined;
      const ext = dirEntry.name.split('.').pop();

      switch (ext) {
        case 'html':
          type = 'text/html';
          break;
        case 'js':
          type = 'text/javascript';
          break;
        case 'css':
          type = 'text/css';
          break;
        case 'png':
          type = 'image/png';
          break;
        case 'map':
          type = 'application/json';
          break;
      }
      const body = await Deno.readTextFile(directory + '/' + dirEntry.name);
      router.get(
        dirEntry.name === 'index.html'
          ? '/' // if index.html then root else remove public from path name
          : '/' + (directory + '/').replace('public/', '') + dirEntry.name,
        (context: Context) => {
          context.response.type = type;
          context.response.body = body;
        },
      );
    }
  }
}

const router = new Router();
serveFilesFrom(router, 'public');
const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

console.log('Listening on http://localhost:8000');

await app.listen({ port: 8000 });
