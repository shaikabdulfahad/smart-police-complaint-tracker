import { processDeadlines } from '@/lib/processor';
export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return new Response('Unauthorized', { status: 401 });
  try { return Response.json(await processDeadlines()); }
  catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}
