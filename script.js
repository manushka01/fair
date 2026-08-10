document.addEventListener('DOMContentLoaded', function () {

  /* ============ DROPDOWN MENUS (Grant Schemes, Solutions, etc.) ============ */
  var dropdowns = document.querySelectorAll('.has-dropdown');

  dropdowns.forEach(function (item) {
    var toggle = item.querySelector('.dropdown-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = item.classList.contains('open');

      dropdowns.forEach(function (other) {
        if (other !== item) other.classList.remove('open');
      });

      item.classList.toggle('open', !isOpen);
    });
  });

  document.addEventListener('click', function () {
    dropdowns.forEach(function (item) { item.classList.remove('open'); });
  });

  /* ============ MOBILE HAMBURGER MENU ============ */
  var mobileToggle = document.getElementById('mobileNavToggle');
  var mainNav = document.getElementById('mainNav');

  if (mobileToggle && mainNav) {
    mobileToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      mainNav.classList.toggle('mobile-open');
    });
  }

  /* ============ FLIP CARDS (services section) ============ */
  document.querySelectorAll('.flip-card').forEach(function (card) {
    card.addEventListener('click', function () {
      card.classList.toggle('flipped');
    });
  });

});
