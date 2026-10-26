(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Accessible mobile navigation
  const menuButton = $('.menu-toggle');
  const nav = $('.nav-links');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      menuButton.innerHTML = open ? '✕' : '☰';
    });
    $$('.nav-links a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation menu');
      menuButton.innerHTML = '☰';
    }));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        nav.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.innerHTML = '☰';
      }
    });
  }

  // Reveal animations; content remains visible when reduced motion is preferred.
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    revealItems.forEach(el => observer.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add('in-view'));
  }

  // Gallery category filters and accessible lightbox
  const filterButtons = $$('.filter-btn');
  const galleryItems = $$('.gallery-item');
  filterButtons.forEach(button => button.addEventListener('click', () => {
    filterButtons.forEach(b => {
      const active = b === button;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    const filter = button.dataset.filter;
    galleryItems.forEach(item => {
      item.hidden = !(filter === 'all' || item.dataset.category === filter);
    });
  }));
  const lightbox = $('.lightbox');
  if (lightbox) {
    const lightboxImage = $('img', lightbox);
    const lightboxCaption = $('p', lightbox);
    const closeButton = $('button', lightbox);
    let previousFocus = null;
    const closeLightbox = () => {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (previousFocus) previousFocus.focus();
    };
    galleryItems.forEach(item => item.addEventListener('click', () => {
      const image = $('img', item);
      if (!image) return;
      previousFocus = item;
      lightboxImage.src = image.currentSrc || image.src;
      lightboxImage.alt = image.alt;
      lightboxCaption.textContent = item.dataset.caption || image.alt;
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeButton.focus();
    }));
    closeButton.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox(); });
  }


  const eventSelect = $('#eventType');
  if (eventSelect) {
    const params = new URLSearchParams(window.location.search);
    const eventSlug = params.get('event');
    const eventMap = {
      'wedding-reception': 'Wedding & Reception',
      'haldi-mehndi': 'Haldi & Mehndi',
      'birthday-parties': 'Birthday Party',
      'tent-event-setup': 'Tent & Event Setup',
      'anniversary-engagement': 'Anniversary & Engagement'
    };
    if (eventSlug && eventMap[eventSlug]) eventSelect.value = eventMap[eventSlug];
  }

  // Contact form: no backend and no data storage. All validation happens before WhatsApp is opened.
  const form = $('#enquiry-form');
  if (form) {
    const status = $('#form-status');
    const fallback = $('#whatsapp-fallback');
    const messageBox = $('#whatsapp-message');
    const openLink = $('#open-whatsapp');
    const copyButton = $('#copy-message');
    const setStatus = (message, show = true) => {
      status.textContent = message;
      status.classList.toggle('show', show);
      status.setAttribute('role', 'status');
    };
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const phone = String(data.get('phone') || '').trim();
      const eventType = String(data.get('eventType') || '').trim();
      const guestsRaw = String(data.get('guests') || '').trim();
      const guests = guestsRaw ? Number(guestsRaw) : null;
      if (name.length < 2) { setStatus('Please enter your name (at least 2 characters).'); $('#name').focus(); return; }
      if (!/^[+\d][\d\s()-]{7,18}$/.test(phone)) { setStatus('Please enter a valid contact number.'); $('#phone').focus(); return; }
      if (guestsRaw && (!Number.isInteger(guests) || guests < 1 || guests > 100000)) {
        setStatus('Guest count must be a whole number between 1 and 100,000.'); $('#guests').focus(); return;
      }
      const message = [
        'Hello Narayan Events Planner! I would like to enquire about an event.',
        '',
        `Name: ${name}`,
        `Contact number: ${phone}`,
        `Event type: ${eventType}`,
        `Event date: ${String(data.get('date') || '').trim() || 'Not decided yet'}`,
        `Expected guests: ${guests === null ? 'Not decided yet' : guests}`,
        `Location: ${String(data.get('location') || '').trim() || 'Not specified'}`,
        `Details: ${String(data.get('details') || '').trim() || 'Please contact me to discuss.'}`
      ].join('\n');
      const waUrl = `https://wa.me/918840583727?text=${encodeURIComponent(message)}`;
      messageBox.value = message;
      openLink.href = waUrl;
      fallback.hidden = false;
      setStatus('Your enquiry message is ready. WhatsApp should open in a new tab; if it does not, use the button below to open it manually.');
      const popup = window.open(waUrl, '_blank');
      if (popup) {
        popup.opener = null;
        setStatus('Your message is ready and WhatsApp has been requested in a new tab. Please review and press Send in WhatsApp.');
      } else {
        setStatus('Your browser blocked the WhatsApp pop-up. Your message is safe below—tap “Open WhatsApp” to continue.');
      }
      fallback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    if (copyButton) copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(messageBox.value);
        setStatus('Message copied. Open WhatsApp and paste it into the chat.');
      } catch {
        messageBox.focus();
        messageBox.select();
        const copied = document.execCommand('copy');
        setStatus(copied ? 'Message copied. Open WhatsApp and paste it into the chat.' : 'Select the message above and copy it manually, then open WhatsApp.');
      }
    });
  }

  // Back-to-top control
  const topButton = $('.back-to-top');
  if (topButton) {
    const updateTopButton = () => topButton.classList.toggle('visible', window.scrollY > 500);
    window.addEventListener('scroll', updateTopButton, { passive: true });
    updateTopButton();
    topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // Current year
  $$('[data-current-year]').forEach(el => el.textContent = String(new Date().getFullYear()));
})();
