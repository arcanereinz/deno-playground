import { Router, Context, Application } from './deps.ts';

const router = new Router();
for await (const dirEntry of Deno.readDir('./dist')) {
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
  }

  const body = await Deno.readTextFile('./dist/' + dirEntry.name);
  router.get(
    '/' + (ext === 'html' ? '' : dirEntry.name),
    (context: Context) => {
      context.response.type = type;
      context.response.body = body;
    },
  );
}

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

console.log('Listening on http://localhost:8000');

await app.listen({ port: 8000 });
