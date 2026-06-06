/* =============================================================================
   Crosta Nera — script.js
   -----------------------------------------------------------------------------
   Co tento soubor dělá (dvě nezávislé části):

     A) REVEAL — postupné nabíhání prvků (.reveal) při scrollování.
        Použije moderní IntersectionObserver, ale má i pojistky: pokud API
        chybí nebo z nějakého důvodu nezafunguje, obsah se prostě zobrazí.

     B) DENNÍ MENU — načte events.json a pokud pro dnešek existuje záznam,
        odkryje blok "Dnes pečeme" (jinak zůstává schovaný přes [hidden]).

   Celý kód běží uvnitř IIFE (immediately-invoked function expression) —
   tj. anonymní funkce, která se ihned zavolá. Tím se proměnné neprolijí
   do globálního prostoru a nepoperou se s ničím jiným na stránce.
   ========================================================================== */
(function(){

  /* ===========================================================================
     ČÁST A — REVEAL (nabíhání při scrollu)
     ========================================================================= */

  // Posbírej všechny prvky, které se mají animovat.
  // querySelectorAll vrací NodeList; [].slice.call(...) z něj udělá normální
  // pole, abychom mohli pohodlně použít forEach napříč starými prohlížeči.
  var reveals = [].slice.call(document.querySelectorAll('.reveal'));

  // Pomocná funkce: okamžitě odkrýt VŠECHNY prvky (nouzové zobrazení).
  // Třída .in v CSS nastaví opacity:1 a zruší posun.
  function showAll(){
    reveals.forEach(function(el){ el.classList.add('in'); });
  }

  // Podporuje prohlížeč IntersectionObserver? (sleduje, co je ve viewportu)
  if('IntersectionObserver' in window){

    // Hlídá, jestli observer vůbec někdy "vystřelil" callback.
    var ioFired = false;

    // Vytvoř observer. Callback dostane pole "záznamů" (entries) — pro každý
    // sledovaný prvek info, jestli je právě viditelný (isIntersecting).
    var io = new IntersectionObserver(function(entries){
      ioFired = true;                       // callback proběhl → pojistka netřeba
      entries.forEach(function(entry){
        if(entry.isIntersecting){           // prvek se dostal do viewportu
          entry.target.classList.add('in'); // → odkryj ho (spustí CSS přechod)
          io.unobserve(entry.target);       // a přestaň ho sledovat (stačí jednou)
        }
      });
    }, {
      threshold: .12,                        // stačí, aby bylo vidět ~12 % prvku
      rootMargin: '0px 0px -8% 0px'          // spustí o kousek dřív, než spodek dojede
    });

    // Začni sledovat každý .reveal prvek.
    reveals.forEach(function(el){ io.observe(el); });

    // POJISTKA: kdyby observer do 800 ms vůbec nevystřelil (vzácné edge-case
    // situace), obsah přesto odkryjeme, ať uživatel nezůstane na prázdné stránce.
    setTimeout(function(){ if(!ioFired) showAll(); }, 800);

  } else {
    // Starý prohlížeč bez IntersectionObserver → rovnou ukaž všechno.
    showAll();
  }


  /* ===========================================================================
     ČÁST B — DNEŠNÍ MENU z events.json
     -------------------------------------------------------------------------
     Soubor events.json mapuje datum (klíč ve formátu "YYYY_MM_DD") na pole
     pizz, které se ten den pečou. Blok "Dnes pečeme" je v HTML schovaný
     atributem [hidden]; když pro dnešek existuje záznam, naplníme seznam
     a hidden sundáme (jinak zůstává schovaný).
     ========================================================================= */
  (function loadDailyMenu(){
    var d = new Date();
    var key = d.getFullYear() + '_' +
              String(d.getMonth() + 1).padStart(2, '0') + '_' +
              String(d.getDate()).padStart(2, '0');
    const formatSlovo = new Intl.DateTimeFormat('cs-CZ', {   day: 'numeric',    month: 'long',   year: 'numeric' });

       var humanReadable =(formatSlovo.format(d)); // Např. "6. června 2026"


    fetch('events.json', { cache: 'no-cache' })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(events){
        if(!events) return;
        var items = events[key];
        if(!items || !items.length) return;

        var ul = document.querySelector('.daily ul');
        if(!ul) return;
        ul.innerHTML = items.map(function(name){
          return '<li>' + name.replace(/&/g,'&amp;').replace(/</g,'&lt;') + '</li>';
        }).join('');

        var kdy = document.querySelector('.daily .when');
        if(kdy) kdy.textContent = humanReadable;

        // Záznam pro dnešek existuje → odkryj poznámku i CTA tlačítko.
        var anchor = document.getElementById('dnes');
        if(anchor) anchor.hidden = false;
        var cta = document.querySelector('.cta-daily');
        if(cta) cta.hidden = false;
      })
      .catch(function(){ /* offline / chyba — blok zůstává schovaný */ });
  })();

})();
