import { newSpecPage } from '@stencil/core/testing';
import { UnySpotlightSearch } from './uny-spotlight-search';

describe('uny-spotlight-search', () => {
  it('renders', async () => {
    const { root } = await newSpecPage({
      components: [UnySpotlightSearch],
      html: '<uny-spotlight-search></uny-spotlight-search>',
    });
    expect(root).toEqualHtml(`
      <uny-spotlight-search>
        <mock:shadow-root></mock:shadow-root>
      </uny-spotlight-search>
    `);
  });

  it('renders with values', async () => {
    const { root } = await newSpecPage({
      components: [UnySpotlightSearch],
      html: `<uny-spotlight-search url="http://localhost:8409/spotlight-search"></uny-spotlight-search>`,
    });
    expect(root).toEqualHtml(`
      <uny-spotlight-search url="http://localhost:8409/spotlight-search">
        <mock:shadow-root></mock:shadow-root>
      </uny-spotlight-search>
    `);
  });
});
