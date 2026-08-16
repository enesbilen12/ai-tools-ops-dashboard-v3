// debounce.js: Art arda gelen çağrıları tek çağrıya indirger.
//
// Arama kutusunda kullanılır: her tuş vuruşunda store'u güncellemek tüm kart
// ızgarasını yeniden çizdiriyordu. Kullanıcı yazmayı bıraktıktan sonra bir kez
// çalışır.

// debounce: fn'i, son çağrıdan ms milisaniye sonra çalışacak biçimde sarar.
// Dönen fonksiyonun `cancel()` ve `pending()` yardımcıları vardır: çağıran
// taraf bekleyen bir çağrı olup olmadığını bilmek zorunda (bkz. filters.js —
// bekleyen arama varken girdi kutusuna geri yazma yapılmaz).
export function debounce(fn, ms = 300) {
  let sayac = null;

  function sarmalanmis(...args) {
    if (sayac !== null) clearTimeout(sayac);
    sayac = setTimeout(() => {
      sayac = null;
      fn(...args);
    }, ms);
  }

  sarmalanmis.cancel = () => {
    if (sayac !== null) {
      clearTimeout(sayac);
      sayac = null;
    }
  };

  sarmalanmis.pending = () => sayac !== null;

  return sarmalanmis;
}
