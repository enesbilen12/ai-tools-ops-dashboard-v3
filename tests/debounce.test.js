import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../src/utils/debounce.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('debounce', () => {
  it('süre dolmadan çağırmaz', () => {
    const fn = vi.fn();
    debounce(fn, 300)();
    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  // Asıl amaç: her tuş vuruşunda değil, yazma bitince tek çağrı.
  it('art arda gelen çağrıları tek çağrıya indirger', () => {
    const fn = vi.fn();
    const gecikmeli = debounce(fn, 300);
    gecikmeli('c');
    vi.advanceTimersByTime(100);
    gecikmeli('ch');
    vi.advanceTimersByTime(100);
    gecikmeli('cha');
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('cha'); // son değerle
  });

  it('cancel bekleyen çağrıyı iptal eder', () => {
    const fn = vi.fn();
    const gecikmeli = debounce(fn, 300);
    gecikmeli();
    gecikmeli.cancel();
    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
  });

  // filters.js, bekleyen arama varken girdi kutusuna geri yazma yapmıyor.
  it('pending bekleyen çağrı olup olmadığını bildirir', () => {
    const gecikmeli = debounce(() => {}, 300);
    expect(gecikmeli.pending()).toBe(false);
    gecikmeli();
    expect(gecikmeli.pending()).toBe(true);
    vi.advanceTimersByTime(300);
    expect(gecikmeli.pending()).toBe(false);
  });
});
