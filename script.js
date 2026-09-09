(() => {
  const body = document.body;
  const ageGate = document.getElementById('age-gate');
  const ageYes = document.getElementById('age-yes');
  const ageNo = document.getElementById('age-no');
  const siteHeader = document.getElementById('site-header');
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const eventModal = document.getElementById('event-modal');
  const eventForm = document.getElementById('event-form');
  const eventSuccess = document.getElementById('event-success');
  const cartLayer = document.getElementById('cart-layer');
  const cartContent = document.getElementById('cart-content');
  const cartCount = document.getElementById('cart-count');
  const cartCountTitle = document.getElementById('cart-count-title');
  const cartTotal = document.getElementById('cart-total');
  const toast = document.getElementById('toast');
  let toastTimer;
  let lastFocusedElement = null;
  let cart = [];

  const money = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

  function safeStorageGet(key) {
    try { return window.localStorage.getItem(key); } catch (error) { return null; }
  }

  function safeStorageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (error) { /* Storage may be disabled. */ }
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3300);
  }

  function lockPage(locked) {
    body.classList.toggle('age-locked', locked);
  }

  function closeAgeGate() {
    ageGate.classList.remove('is-visible');
    ageGate.setAttribute('aria-hidden', 'true');
    lockPage(false);
  }

  function openAgeGate() {
    ageGate.classList.add('is-visible');
    ageGate.setAttribute('aria-hidden', 'false');
    lockPage(true);
    window.setTimeout(() => ageYes?.focus(), 80);
  }

  // Show the gate on a new visit. A verified visit is remembered for convenience.
  if (safeStorageGet('liqbuddies-age-verified') === 'true') {
    closeAgeGate();
  } else {
    openAgeGate();
  }

  ageYes?.addEventListener('click', () => {
    safeStorageSet('liqbuddies-age-verified', 'true');
    closeAgeGate();
    showToast('Welcome in — let’s find your next pour.');
  });

  ageNo?.addEventListener('click', () => {
    const ageCard = ageGate.querySelector('.age-card');
    if (!ageCard) return;
    ageCard.innerHTML = `
      <div class="age-card-noise" aria-hidden="true"></div>
      <div class="age-mark" aria-hidden="true"><span>18+</span><i></i></div>
      <p class="eyebrow eyebrow-gold">Access restricted</p>
      <h2>Come back<br /><em>when you’re 18+.</em></h2>
      <p class="age-copy">You must be of legal drinking age in your country to enter Liq Budz. Please drink responsibly.</p>
      <div class="age-actions"><button class="btn btn-outline btn-wide" id="age-return" type="button">Return to previous page <span aria-hidden="true">↩</span></button></div>
      <p class="age-fine">No alcohol sale or service is available to anyone under the legal drinking age.</p>`;
    document.getElementById('age-return')?.addEventListener('click', () => {
      if (window.history.length > 1) window.history.back();
      else showToast('You can close this tab to exit.');
    });
    window.setTimeout(() => document.getElementById('age-return')?.focus(), 50);
  });

  window.addEventListener('scroll', () => {
    siteHeader?.classList.toggle('is-scrolled', window.scrollY > 14);
  }, { passive: true });

  function toggleMobileMenu(force) {
    const shouldOpen = typeof force === 'boolean' ? force : !mobileMenu.classList.contains('is-open');
    mobileMenu.classList.toggle('is-open', shouldOpen);
    menuToggle.classList.toggle('is-open', shouldOpen);
    menuToggle.setAttribute('aria-expanded', String(shouldOpen));
  }

  menuToggle?.addEventListener('click', () => toggleMobileMenu());
  mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => toggleMobileMenu(false)));
  mobileMenu?.querySelector('[data-open-event]')?.addEventListener('click', () => {
    toggleMobileMenu(false);
    openEventModal();
  });

  function openEventModal() {
    lastFocusedElement = document.activeElement;
    eventModal.hidden = false;
    body.classList.add('age-locked');
    eventModal.setAttribute('aria-hidden', 'false');
    eventForm.hidden = false;
    eventSuccess.hidden = true;
    window.setTimeout(() => eventModal.querySelector('input')?.focus(), 80);
  }

  function closeEventModal() {
    eventModal.hidden = true;
    eventModal.setAttribute('aria-hidden', 'true');
    if (!cartLayer || cartLayer.hidden) body.classList.remove('age-locked');
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
  }

  document.querySelectorAll('[data-open-event]').forEach(button => {
    // The mobile trigger is wired above; this guard prevents duplicate behavior.
    if (button.closest('#mobile-menu')) return;
    button.addEventListener('click', openEventModal);
  });
  eventModal?.querySelectorAll('[data-close-event]').forEach(element => element.addEventListener('click', closeEventModal));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (eventModal && !eventModal.hidden) closeEventModal();
      if (cartLayer && !cartLayer.hidden) closeCart();
      if (mobileMenu?.classList.contains('is-open')) toggleMobileMenu(false);
    }
  });

  eventForm?.addEventListener('submit', event => {
    event.preventDefault();
    eventForm.hidden = true;
    eventSuccess.hidden = false;
    eventSuccess.querySelector('button')?.focus();
  });

  // Product filters
  const filterButtons = document.querySelectorAll('[data-filter]');
  const productCards = document.querySelectorAll('[data-product-category]');
  function applyFilter(filter) {
    filterButtons.forEach(button => button.classList.toggle('is-active', button.dataset.filter === filter));
    productCards.forEach(card => card.classList.toggle('is-hidden', filter !== 'all' && card.dataset.productCategory !== filter));
  }
  filterButtons.forEach(button => button.addEventListener('click', () => applyFilter(button.dataset.filter)));
  document.querySelectorAll('[data-filter-link]').forEach(link => link.addEventListener('click', () => {
    applyFilter(link.dataset.filterLink);
  }));

  // Cart
  function cartQuantity() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  function renderCart() {
    const quantity = cartQuantity();
    cartCount.textContent = quantity;
    cartCountTitle.textContent = `(${quantity})`;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = money.format(total);

    if (!cart.length) {
      cartContent.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-mark">✦</div>
          <h3>Your basket is waiting.</h3>
          <p>Bring a little more flavor to the night. Your chosen bottles will show up here.</p>
          <button class="btn btn-outline" type="button" data-start-shopping>Start shopping <span>↗</span></button>
        </div>`;
      cartContent.querySelector('[data-start-shopping]')?.addEventListener('click', () => {
        closeCart();
        document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' });
      });
      return;
    }

    cartContent.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-art" aria-hidden="true"></div>
        <div>
          <h3>${item.name}</h3>
          <p>${money.format(item.price)} each</p>
          <div class="cart-item-controls" data-cart-controls="${item.id}">
            <button type="button" data-cart-decrease aria-label="Decrease ${item.name}">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-cart-increase aria-label="Increase ${item.name}">+</button>
          </div>
        </div>
        <strong class="cart-item-price">${money.format(item.price * item.quantity)}</strong>
      </div>`).join('');

    cartContent.querySelectorAll('[data-cart-decrease]').forEach(button => button.addEventListener('click', () => updateCart(button.closest('[data-cart-controls]').dataset.cartControls, -1)));
    cartContent.querySelectorAll('[data-cart-increase]').forEach(button => button.addEventListener('click', () => updateCart(button.closest('[data-cart-controls]').dataset.cartControls, 1)));
  }

  function updateCart(id, delta) {
    const item = cart.find(entry => entry.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) cart = cart.filter(entry => entry.id !== id);
    renderCart();
  }

  function addToCart(button) {
    const { id, name, price } = button.dataset;
    const existing = cart.find(item => item.id === id);
    if (existing) existing.quantity += 1;
    else cart.push({ id, name, price: Number(price), quantity: 1 });
    renderCart();
    button.classList.add('is-added');
    const label = button.querySelector('span');
    if (label) label.textContent = 'Added to basket';
    showToast(`${name} added to your basket.`);
    window.setTimeout(() => {
      button.classList.remove('is-added');
      if (label) label.textContent = 'Add to basket';
    }, 1400);
  }

  document.querySelectorAll('[data-add-product]').forEach(button => button.addEventListener('click', () => addToCart(button)));

  function openCart() {
    lastFocusedElement = document.activeElement;
    cartLayer.hidden = false;
    body.classList.add('cart-is-open');
    cartLayer.setAttribute('aria-hidden', 'false');
    renderCart();
    window.setTimeout(() => document.getElementById('cart-close')?.focus(), 80);
  }

  function closeCart() {
    if (!cartLayer || cartLayer.hidden) return;
    cartLayer.hidden = true;
    cartLayer.setAttribute('aria-hidden', 'true');
    body.classList.remove('cart-is-open');
    if (!eventModal || eventModal.hidden) body.classList.remove('age-locked');
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
  }

  document.getElementById('cart-open')?.addEventListener('click', openCart);
  document.getElementById('cart-close')?.addEventListener('click', closeCart);
  document.getElementById('cart-close-backdrop')?.addEventListener('click', closeCart);
  document.getElementById('checkout-button')?.addEventListener('click', () => {
    if (!cart.length) {
      showToast('Your basket is empty — choose a bottle first.');
      return;
    }
    showToast('Secure checkout is being prepared for your order.');
  });
  renderCart();

  // Category cards and buttons should feel like real storefront controls.
  document.querySelectorAll('[data-toast]').forEach(element => element.addEventListener('click', event => {
    event.preventDefault();
    showToast(element.dataset.toast);
  }));

  document.getElementById('newsletter-form')?.addEventListener('submit', event => {
    event.preventDefault();
    event.currentTarget.reset();
    document.getElementById('newsletter-success')?.classList.add('is-visible');
    showToast('You’re on the list. See you at the next drop.');
  });
})();
