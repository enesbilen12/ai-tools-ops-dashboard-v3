import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  normalizeError,
  fetchTools,
  createTool,
  updateTool,
  softDeleteTool,
  restoreTool,
} from '../src/api/toolsApi.js';
import { TOOLS_ENDPOINT } from '../src/constants.js';

// yanit: fetch'in döndürdüğü Response nesnesinin asgari taklidi.
function yanit({ ok = true, status = 200, govde = [] } = {}) {
  return { ok, status, json: async () => govde };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('normalizeError', () => {
  it('ağ hatasında (status 0) json-server ipucu verir', () => {
    const hata = normalizeError({ url: '/tools', status: 0 });
    expect(hata.message).toContain('npm run api');
    expect(hata.status).toBe(0);
    expect(hata.url).toBe('/tools');
  });

  it('404 ile 500 farklı mesaj üretir', () => {
    const yok = normalizeError({ status: 404 });
    const sunucu = normalizeError({ status: 500 });
    expect(yok.message).toContain('404');
    expect(sunucu.message).toContain('500');
    expect(yok.message).not.toBe(sunucu.message);
  });

  it('4xx ve 5xx ayrı kollara düşer', () => {
    expect(normalizeError({ status: 400 }).message).toContain('reddedildi');
    expect(normalizeError({ status: 503 }).message).toContain('Sunucu hatası');
  });

  it('status ve url alanlarını Error üzerinde taşır', () => {
    const hata = normalizeError({ url: 'http://x/tools/3', status: 500 });
    expect(hata).toBeInstanceOf(Error);
    expect(hata.status).toBe(500);
    expect(hata.url).toBe('http://x/tools/3');
  });

  it('cause verilirse zincire ekler', () => {
    const kok = new Error('socket kapandı');
    expect(normalizeError({ status: 0, cause: kok }).cause).toBe(kok);
  });

  it('argümansız çağrıda ağ hatası varsayar', () => {
    expect(normalizeError().status).toBe(0);
  });

  // İptal bir arıza değil, uygulamanın kendi kararı. Ayrılmazsa status 0'a
  // düşer ve kullanıcıya "json-server çalışıyor mu?" denirdi.
  it('iptal edilen isteği ağ hatasından ayırır', () => {
    const iptal = new Error('The operation was aborted.');
    iptal.name = 'AbortError';
    const hata = normalizeError({ url: '/tools', status: 0, cause: iptal });
    expect(hata.aborted).toBe(true);
    expect(hata.status).toBe(-1);
    expect(hata.message).not.toContain('npm run api');
  });

  it('status -1 ile de iptal olarak normalize eder', () => {
    expect(normalizeError({ status: -1 }).aborted).toBe(true);
  });
});

describe('fetchTools', () => {
  it('doğru uç noktayı çağırır ve gövdeyi döndürür', async () => {
    const sahte = vi.fn(async () => yanit({ govde: [{ id: '1', name: 'ChatGPT' }] }));
    vi.stubGlobal('fetch', sahte);

    const sonuc = await fetchTools();
    expect(sahte).toHaveBeenCalledWith(TOOLS_ENDPOINT, undefined);
    expect(sonuc).toEqual([{ id: '1', name: 'ChatGPT' }]);
  });

  it('sunucu kapalıysa normalize edilmiş ağ hatası fırlatır', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }));

    await expect(fetchTools()).rejects.toMatchObject({ status: 0 });
    await expect(fetchTools()).rejects.toThrow('npm run api');
  });

  it('HTTP hatasında durum kodunu taşır', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => yanit({ ok: false, status: 500 })));
    await expect(fetchTools()).rejects.toMatchObject({ status: 500 });
  });

  it('verilen signal fetch seçeneklerine geçer', async () => {
    const sahte = vi.fn(async () => yanit({ govde: [] }));
    vi.stubGlobal('fetch', sahte);

    const kontrol = new AbortController();
    await fetchTools(kontrol.signal);
    expect(sahte).toHaveBeenCalledWith(TOOLS_ENDPOINT, { signal: kontrol.signal });
  });

  it('iptal edilen istek aborted:true ile reddeder', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      const iptal = new Error('The operation was aborted.');
      iptal.name = 'AbortError';
      throw iptal;
    }));

    await expect(fetchTools(new AbortController().signal)).rejects.toMatchObject({
      aborted: true,
      status: -1,
    });
  });
});

describe('createTool', () => {
  it('POST gönderir ve deleted:false ile başlatır', async () => {
    const sahte = vi.fn(async () => yanit({ govde: { id: '19' } }));
    vi.stubGlobal('fetch', sahte);

    await createTool({ name: 'Yeni', category: 'Kod' });

    const [url, secenekler] = sahte.mock.calls[0];
    expect(url).toBe(TOOLS_ENDPOINT);
    expect(secenekler.method).toBe('POST');
    expect(JSON.parse(secenekler.body)).toEqual({
      name: 'Yeni',
      category: 'Kod',
      deleted: false,
    });
  });
});

describe('updateTool / softDeleteTool / restoreTool', () => {
  it('updateTool PATCH ile kısmi güncelleme yapar', async () => {
    const sahte = vi.fn(async () => yanit({ govde: {} }));
    vi.stubGlobal('fetch', sahte);

    await updateTool('3', { status: 'Pasif' });

    const [url, secenekler] = sahte.mock.calls[0];
    expect(url).toBe(`${TOOLS_ENDPOINT}/3`);
    expect(secenekler.method).toBe('PATCH');
    expect(JSON.parse(secenekler.body)).toEqual({ status: 'Pasif' });
  });

  it('softDeleteTool yalnızca deleted:true yollar (kayıt silinmez)', async () => {
    const sahte = vi.fn(async () => yanit({ govde: {} }));
    vi.stubGlobal('fetch', sahte);

    await softDeleteTool('3');

    const [, secenekler] = sahte.mock.calls[0];
    expect(secenekler.method).toBe('PATCH'); // DELETE değil
    expect(JSON.parse(secenekler.body)).toEqual({ deleted: true });
  });

  it('restoreTool deleted:false yollar', async () => {
    const sahte = vi.fn(async () => yanit({ govde: {} }));
    vi.stubGlobal('fetch', sahte);

    await restoreTool('3');
    expect(JSON.parse(sahte.mock.calls[0][1].body)).toEqual({ deleted: false });
  });

  it('204 yanıtında json() çağrılmaz, null döner', async () => {
    const jsonCagrisi = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 204, json: jsonCagrisi })));

    await expect(updateTool('3', {})).resolves.toBeNull();
    expect(jsonCagrisi).not.toHaveBeenCalled();
  });
});
