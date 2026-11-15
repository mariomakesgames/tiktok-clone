'use client';

import dynamic from 'next/dynamic';

const AdminStudio = dynamic(
  async () => {
    const [
      { Studio, defineConfig },
      { structureTool },
      { visionTool },
      { schemaTypes },
    ] = await Promise.all([
      import('sanity'),
      import('sanity/structure'),
      import('@sanity/vision'),
      import('../../../sanity/schemas'),
    ]);

    const config = defineConfig({
      name: 'default',
      title: 'Robloxtok Admin',
      basePath: '/admin',
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: 'production',
      plugins: [structureTool(), visionTool()],
      schema: { types: schemaTypes },
    });

    return function AdminStudio() {
      return <Studio config={config} />;
    };
  },
  {
    ssr: false,
    loading: () => <p role='status'>Loading Sanity Studio…</p>,
  },
);

export default function AdminPage() {
  return <AdminStudio />;
}
