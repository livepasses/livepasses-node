import type { ApiPagedResponse } from '../types/common.js';

/**
 * Returns an async generator that automatically paginates through all pages.
 *
 * @example
 * ```ts
 * for await (const pass of autoPaginate((page) => client.passes.list({ page }))) {
 *   console.log(pass.id);
 * }
 * ```
 */
export async function* autoPaginate<T>(
  fn: (page: number) => Promise<ApiPagedResponse<T>>,
): AsyncGenerator<T, void, undefined> {
  let page = 1;

  while (true) {
    const response = await fn(page);

    for (const item of response.items) {
      yield item;
    }

    if (page >= response.pagination.totalPages || response.items.length === 0) {
      break;
    }

    page++;
  }
}
