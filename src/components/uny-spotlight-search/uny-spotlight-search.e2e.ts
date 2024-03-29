import { newE2EPage } from '@stencil/core/testing';

describe('uny-spotlight-search', () => {
  it('renders', async () => {
    const page = await newE2EPage();

    await page.setContent('<uny-spotlight-search></uny-spotlight-search>');
    const element = await page.find('uny-spotlight-search');
    expect(element).toHaveClass('hydrated');
  });

  it('renders changes to the name data', async () => {
    const page = await newE2EPage();

    await page.setContent('<uny-spotlight-search></uny-spotlight-search>');
    const component = await page.find('uny-spotlight-search');
    const element = await page.find('uny-spotlight-search >>> div');
    expect(element.textContent).toEqual(`Hello, World! I'm `);

    component.setProperty('first', 'James');
    await page.waitForChanges();
    expect(element.textContent).toEqual(`Hello, World! I'm James`);

    component.setProperty('last', 'Quincy');
    await page.waitForChanges();
    expect(element.textContent).toEqual(`Hello, World! I'm James Quincy`);

    component.setProperty('middle', 'Earl');
    await page.waitForChanges();
    expect(element.textContent).toEqual(`Hello, World! I'm James Earl Quincy`);
  });
});
