import { describe, expect, it } from 'vitest';
import { cityOptionUrl, findIssuuDocs, issuuPageImages, MAX_ISSUU_PAGES } from './issuu';

describe('issuu', () => {
  it('finds embedded and linked documents on a store page', () => {
    const iframe =
      '<iframe style="width:100%" src="https://e.issuu.com/embed.html?d=katalos_ka_ponuda_20.10-1.11.2026._fbih&amp;u=bingotuzla2"></iframe>';
    expect(findIssuuDocs(iframe)).toEqual([{ user: 'bingotuzla2', doc: 'katalos_ka_ponuda_20.10-1.11.2026._fbih' }]);
    const links =
      '<a href="https://issuu.com/mercator_bih/docs/pika_katalog_-_27.10.-2.11.2026._i">Pregled</a>' +
      '<a href="https://issuu.com/mercator_bih/docs/redovni_katalog_-_27.10.-2.11.2026._i">Pregled</a>' +
      '<a href="https://issuu.com/mercator_bih/docs/pika_katalog_-_27.10.-2.11.2026._i">opet</a>';
    expect(findIssuuDocs(links).map((d) => d.doc)).toEqual([
      'pika_katalog_-_27.10.-2.11.2026._i',
      'redovni_katalog_-_27.10.-2.11.2026._i',
    ]);
    expect(findIssuuDocs('<p>nema</p>')).toEqual([]);
  });

  it('picks the city from a city list', () => {
    const select =
      '<select><option value="/akcije/katalozi/">Odaberi grad</option>' +
      '<option value="/akcije/katalozi/?kcity=6">Banja Luka</option>' +
      '<option value="/akcije/katalozi/?kcity=1" selected>Sarajevo</option>' +
      '<option value="/akcije/katalozi/?kcity=19">Žepče</option></select>';
    const base = 'https://www.mercator.ba/akcije/katalozi/';
    expect(cityOptionUrl(select, 'Sarajevo', base)).toBe('https://www.mercator.ba/akcije/katalozi/?kcity=1');
    expect(cityOptionUrl(select, ' banja luka', base)).toBe('https://www.mercator.ba/akcije/katalozi/?kcity=6');
    expect(cityOptionUrl(select, 'Zepce', base)).toBe('https://www.mercator.ba/akcije/katalozi/?kcity=19');
    expect(cityOptionUrl(select, 'Ilidža', base)).toBeNull();
  });

  it('lists the page images of a document', () => {
    const html =
      '<meta content="https://image.isu.pub/261020093311-71e48/jpg/page_1_social_preview.jpg">' +
      '<script>{\\"originalPublishDateInISOString\\":\\"2026-10-19\\",\\"pageCount\\":3,\\"publicationId\\":\\"71e48\\"}</script>';
    expect(issuuPageImages(html)).toEqual([
      'https://image.isu.pub/261020093311-71e48/jpg/page_1.jpg',
      'https://image.isu.pub/261020093311-71e48/jpg/page_2.jpg',
      'https://image.isu.pub/261020093311-71e48/jpg/page_3.jpg',
    ]);
    expect(issuuPageImages(html.replace('"pageCount\\":3', '"pageCount\\":99'))).toHaveLength(MAX_ISSUU_PAGES);
    expect(issuuPageImages('<p>no id</p>')).toEqual([]);
  });
});
