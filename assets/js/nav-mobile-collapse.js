/* =====================================================================
   nav-mobile-collapse.js
   ---------------------------------------------------------------------
   The theme's own responsive menu (greedy-nav, bundled inside
   assets/js/main.min.js) only moves a tab into the dropdown once it
   measures that the row of tabs no longer fits. On many phone widths
   that only pushes the LAST tab (e.g. "Teaching") into the dropdown,
   leaving the others still shown as a partial row -- not the "either
   all tabs, or just the button" look wanted here.

   This script runs independently, after the bundled one, and simply
   overrules it below MOBILE_BREAKPOINT: every non-persist tab is moved
   into the dropdown regardless of whether it would technically fit.
   Above the breakpoint it hands everything back and lets the bundled
   script's own resize handling decide normally, which is exactly
   today's desktop behaviour (tabs visible, no dropdown).

   Why a separate file instead of editing the bundled script: main.min.js
   is a built, minified bundle (jQuery + several plugins concatenated at
   dev time). Jekyll's GitHub Pages build does not re-run that build
   step, so hand-editing the plugin's original source under
   assets/js/plugins/ would have no effect on the live site -- only the
   already-built main.min.js is ever served. Patching it in place, in
   its minified form, would be fragile. A small script loaded after it
   is the safe way to change this behaviour without touching the bundle.
   ===================================================================== */
(function () {
  "use strict";

  /* Phones only, not tablets: 600px matches the theme's own $small
     breakpoint. Raise it (e.g. to 768, the theme's $medium) to also
     force the collapse on tablets / landscape phones. */
  var MOBILE_BREAKPOINT = 600;

  var nav = document.getElementById("site-nav");
  if (!nav) return;
  var btn = nav.querySelector("button");
  var vlinks = nav.querySelector(".visible-links");
  var hlinks = nav.querySelector(".hidden-links");
  if (!btn || !vlinks || !hlinks) return;

  /* True only while items are hidden because THIS script put them
     there -- as opposed to the bundled script hiding some of them on
     its own because they genuinely don't fit, even above the phone
     breakpoint (e.g. a narrow desktop window). That distinction is
     what stops the two scripts from fighting each other. */
  var forcedByUs = false;

  function isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function collapseAll() {
    var moved = false;
    var item = vlinks.querySelector("li:not(.persist):last-child");
    while (item) {
      hlinks.insertBefore(item, hlinks.firstChild);
      moved = true;
      item = vlinks.querySelector("li:not(.persist):last-child");
    }
    if (moved) forcedByUs = true;
    if (hlinks.children.length > 0) btn.classList.remove("hidden");
  }

  function restoreOursAndRecheck() {
    if (!forcedByUs) return;              // nothing here is ours to give back
    var item = hlinks.firstElementChild;
    while (item) {
      vlinks.appendChild(item);
      item = hlinks.firstElementChild;
    }
    forcedByUs = false;
    /* Let the bundled greedy-nav script's own resize handler (registered
       before this one, so it always runs first) re-measure the now
       complete tab row against the current width. */
    window.dispatchEvent(new Event("resize"));
  }

  function reflow() {
    if (isMobile()) {
      collapseAll();
    } else {
      restoreOursAndRecheck();
    }
  }

  window.addEventListener("resize", reflow);
  window.addEventListener("orientationchange", reflow);
  window.addEventListener("load", reflow);
  reflow();
})();
