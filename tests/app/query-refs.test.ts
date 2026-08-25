import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');

function vueFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return vueFiles(full);
    return full.endsWith('.vue') ? [full] : [];
  });
}

function templateOf(source: string): string {
  return source.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
}

/**
 * `useQuery` returns a plain object of refs, and Vue only unwraps top-level
 * setup bindings. Reaching through the query object in markup — `fooQuery.isPending`
 * — therefore yields the ref itself, which is always truthy: skeletons never come
 * down and disabled buttons never re-enable. Destructure the flags instead.
 */
describe('query results are never dereferenced in a template', () => {
  const offenders = vueFiles(SRC).flatMap((file) => {
    const template = templateOf(readFileSync(file, 'utf8'));
    return [...template.matchAll(/\b\w*(?:Query|Mut)\.\w+/g)].map(
      (match) => `${relative(SRC, file)}: ${match[0]}`,
    );
  });

  it('finds no query dereferences in any single-file component', () => {
    expect(offenders).toEqual([]);
  });
});
