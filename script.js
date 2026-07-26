/* ============================================================
   Lexi Crew Enterprises — Main JavaScript
   File: script.js
   Sections:
   0. Preloader
   0.5 Scroll Progress Bar
   0.6 Announcement Bar
   0.7 Dark/Light Mode Toggle
   1. Navbar scroll + mobile menu
   2. Scroll-based animations (custom AOS)
   3. Testimonials carousel
   4. Portfolio filter
   5. Counter animation
   6. Contact form validation
   7. Newsletter form
   7.5 Cookie Consent Banner
   8. Back-to-top button
   9. Play button (reel modal)
   ============================================================ */

'use strict';

/* ══════════════════════════════════════════
   GLOBAL AGENCY CONFIGURATION (Formspree Integration)
   To receive all website leads directly in your email inbox:
   1. Sign up for free at https://formspree.io
   2. Create a new form and copy your Form ID (e.g., 'xxyzabck')
   3. Paste your Form ID in formspreeEndpoint below!
   ══════════════════════════════════════════ */
const LEXI_CONFIG = {
  formspreeEndpoint: 'https://formspree.io/f/YOUR_FORMSPREE_ID', // Replace with your Formspree ID
  adminEmail: 'hello@lexicrewenterprises.com',
  adminPhone: '+918667646502'
};

/* Central Formspree Email Lead Dispatcher */
async function sendLeadToFormspree(formType, dataPayload) {
  // Always log locally as a backup for Admin Dashboard
  try {
    const existing = JSON.parse(localStorage.getItem('lexicrew_leads') || '[]');
    const leadEntry = {
      id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      formType: formType,
      status: 'new', // 'new' | 'contacted' | 'closed'
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }),
      ...dataPayload
    };
    existing.unshift(leadEntry);
    localStorage.setItem('lexicrew_leads', JSON.stringify(existing));
  } catch (e) {
    console.warn('Local lead storage error:', e);
  }

  // If user hasn't set up custom Formspree ID yet, simulate clean success
  if (!LEXI_CONFIG.formspreeEndpoint || LEXI_CONFIG.formspreeEndpoint.includes('YOUR_FORMSPREE_ID')) {
    console.log(`[Formspree Demo Payload for ${formType}]:`, dataPayload);
    return true;
  }

  try {
    const response = await fetch(LEXI_CONFIG.formspreeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: `New Lead [${formType}] — Lexi Crew Enterprises`,
        Form_Source: formType,
        Date_Submitted: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        ...dataPayload
      })
    });
    return response.ok;
  } catch (err) {
    console.error('Formspree dispatch error:', err);
    return false;
  }
}

/* ── Utility: debounce ── */
function debounce(fn, delay = 100) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ── Utility: throttle ── */
function throttle(fn, limit = 100) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= limit) { last = now; fn(...args); }
  };
}


/* ══════════════════════════════════════════
   0. PRELOADER
   ══════════════════════════════════════════ */
(function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  function hidePreloader() {
    setTimeout(() => preloader.classList.add('hidden'), 1600);
  }

  if (document.readyState === 'complete') {
    hidePreloader();
  } else {
    window.addEventListener('load', hidePreloader);
  }
})();


/* ══════════════════════════════════════════
   0.5 SCROLL PROGRESS BAR
   ══════════════════════════════════════════ */
(function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = scrollHeight ? (scrollTop / scrollHeight) * 100 : 0;
    bar.style.width = progress + '%';
  }, { passive: true });
})();


/* ══════════════════════════════════════════
   0.6 ANNOUNCEMENT BAR
   ══════════════════════════════════════════ */
(function initAnnouncementBar() {
  const bar = document.getElementById('announcementBar');
  const closeBtn = document.getElementById('announcementClose');
  if (!bar || !closeBtn) return;

  // Hide if dismissed this session
  if (sessionStorage.getItem('announcementDismissed')) {
    bar.classList.add('hidden');
  }

  closeBtn.addEventListener('click', () => {
    bar.classList.add('hidden');
    sessionStorage.setItem('announcementDismissed', 'true');
  });
})();


/* ══════════════════════════════════════════
   0.7 DARK / LIGHT MODE TOGGLE
   ══════════════════════════════════════════ */
(function initThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  const html   = document.documentElement;
  if (!toggle) return;

  const toggleText = toggle.querySelector('.theme-toggle-text');

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    toggle.setAttribute('aria-checked', theme === 'light' ? 'true' : 'false');
    if (toggleText) {
      toggleText.textContent = theme === 'light' ? 'Light' : 'Dark';
    }
  }

  // Load saved preference or default to dark
  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);

  toggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });
})();

/* ══════════════════════════════════════════
   1. NAVBAR — sticky + transparent-to-solid
   ══════════════════════════════════════════ */
(function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const mobileMenu= document.getElementById('mobileMenu');

  if (!navbar || !navToggle || !mobileMenu) return;

  /* Scroll handler */
  const onScroll = throttle(() => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);

    /* Active nav link based on section in view */
    const sections = document.querySelectorAll('section[id], div[id="home"]');
    const navLinks  = document.querySelectorAll('.nav-links a');
    let current = '';

    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }, 80);

  window.addEventListener('scroll', onScroll, { passive: true });

  /* Hamburger toggle */
  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.classList.toggle('open');
    mobileMenu.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  /* Close mobile menu on resize */
  window.addEventListener('resize', debounce(() => {
    if (window.innerWidth > 640) closeMobile();
  }, 150));
})();

/* Exposed globally so onclick in HTML can call it */
function closeMobile() {
  const navToggle  = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!navToggle) return;
  navToggle.classList.remove('open');
  mobileMenu.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}


/* ══════════════════════════════════════════
   2. SCROLL ANIMATIONS (custom lightweight AOS)
   ══════════════════════════════════════════ */
(function initAOS() {
  const elements = document.querySelectorAll('[data-aos]');
  if (!elements.length) return;

  /* Respect prefers-reduced-motion */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    elements.forEach(el => el.classList.add('aos-animate'));
    return;
  }

  /* Apply delay if set */
  elements.forEach(el => {
    const delay = el.dataset.aosDelay;
    if (delay) el.style.transitionDelay = delay + 'ms';
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-animate');
          observer.unobserve(entry.target); /* Only animate once */
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
})();


/* ══════════════════════════════════════════
   3. TESTIMONIALS CAROUSEL
   ══════════════════════════════════════════ */
(function initCarousel() {
  const track   = document.getElementById('testimonialsTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dots    = document.querySelectorAll('#carouselDots .dot');

  if (!track) return;

  const cards   = track.querySelectorAll('.testimonial-card');
  let current   = 0;
  let autoTimer;
  let cardsVisible = getCardsVisible();

  function getCardsVisible() {
    if (window.innerWidth < 640)  return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  }

  function getCardWidth() {
    const card = cards[0];
    if (!card) return 0;
    const style = getComputedStyle(track);
    const gap = parseFloat(style.gap) || 24;
    return card.offsetWidth + gap;
  }

  function goTo(index) {
    cardsVisible = getCardsVisible();
    const maxIndex = Math.max(0, cards.length - cardsVisible);
    current = Math.max(0, Math.min(index, maxIndex));

    track.style.transform = `translateX(-${current * getCardWidth()}px)`;

    /* Update active card */
    cards.forEach((c, i) => c.classList.toggle('active', i === current));

    /* Update dots */
    dots.forEach((dot, i) => {
      const isActive = i === current;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', isActive);
    });
  }

  function next() { goTo(current + 1 > cards.length - cardsVisible ? 0 : current + 1); }
  function prev() { goTo(current - 1 < 0 ? cards.length - cardsVisible : current - 1); }

  if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetAuto(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetAuto(); });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); resetAuto(); });
  });

  /* Autoplay */
  function startAuto() { autoTimer = setInterval(next, 5000); }
  function resetAuto()  { clearInterval(autoTimer); startAuto(); }

  startAuto();

  /* Pause on hover */
  const carousel = document.querySelector('.testimonials-carousel');
  if (carousel) {
    carousel.addEventListener('mouseenter', () => clearInterval(autoTimer));
    carousel.addEventListener('mouseleave', startAuto);
  }

  /* Touch/swipe support */
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); resetAuto(); }
  }, { passive: true });

  /* Recalculate on resize */
  window.addEventListener('resize', debounce(() => goTo(current), 200));
})();


/* ══════════════════════════════════════════
   4. PORTFOLIO FILTER
   ══════════════════════════════════════════ */
(function initPortfolioFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.portfolio-card');

  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      /* Update active button */
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const selectedFilter = btn.dataset.filter; // capture locally to avoid race condition

      cards.forEach(card => {
        const matches = selectedFilter === 'all' || card.dataset.category === selectedFilter;

        if (matches) {
          /* Show card */
          card.style.display = '';
          /* Force reflow so transition fires */
          void card.offsetWidth;
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
        } else {
          /* Fade out then hide */
          card.style.opacity = '0';
          card.style.transform = 'scale(0.9)';
          setTimeout(() => {
            /* Only hide if this card is STILL supposed to be hidden */
            if (card.style.opacity === '0') {
              card.style.display = 'none';
            }
          }, 320);
        }
      });
    });
  });
})();


/* ══════════════════════════════════════════
   5. ANIMATED COUNTERS
   ══════════════════════════════════════════ */
(function initCounters() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateCounter(el) {
    if (el.dataset.animated === 'true') return;
    el.dataset.animated = 'true';

    const target = parseFloat(el.dataset.target);
    const isDecimal = el.dataset.decimal;

    if (prefersReduced || !target) {
      el.textContent = isDecimal ? target.toFixed(parseInt(isDecimal)) : target.toLocaleString();
      return;
    }

    const duration = 2000;
    const start = Date.now();

    function update() {
      const elapsed  = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      /* Ease-out cubic */
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;

      el.textContent = isDecimal
        ? value.toFixed(parseInt(isDecimal))
        : Math.floor(value).toLocaleString();

      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = isDecimal ? target.toFixed(parseInt(isDecimal)) : target.toLocaleString();
    }

    requestAnimationFrame(update);
  }

  // Observe the stat-item PARENT elements (which have data-aos).
  // When AOS adds 'aos-animate' class (making the parent visible),
  // we trigger the counter inside it.
  const statItems = document.querySelectorAll('.stat-item');

  if (statItems.length) {
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const el = mutation.target;
          if (el.classList.contains('aos-animate')) {
            const counter = el.querySelector('.counter');
            if (counter) animateCounter(counter);
          }
        }
      });
    });

    statItems.forEach(item => {
      // If already visible (no data-aos or already animated)
      if (!item.dataset.aos || item.classList.contains('aos-animate')) {
        const counter = item.querySelector('.counter');
        if (counter) animateCounter(counter);
      } else {
        mutationObserver.observe(item, { attributes: true, attributeFilter: ['class'] });
      }
    });
  } else {
    // Fallback: animate all counters directly
    counters.forEach(counter => animateCounter(counter));
  }
})();


/* ══════════════════════════════════════════
   6. CONTACT FORM VALIDATION
   NOTE: To actually send emails, integrate with:
   - Formspree (https://formspree.io) — add action="https://formspree.io/f/YOUR_ID"
   - EmailJS (https://www.emailjs.com)
   - Your own backend API endpoint
   ══════════════════════════════════════════ */
(function initContactForm() {
  const form      = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const formSuccess = document.getElementById('formSuccess');

  if (!form) return;

  /* Validation rules */
  const rules = {
    firstName: { required: true, minLen: 2, errorId: 'firstNameError' },
    lastName:  { required: false, minLen: 1, errorId: 'lastNameError'  },
    email:     { required: false, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, errorId: 'emailError' },
    message:   { required: true, minLen: 3, errorId: 'messageError'  },
  };

  function validateField(input, rule) {
    const val = input.value.trim();
    let isValid = true;
    const errorEl = document.getElementById(rule.errorId);

    if (rule.required && !val) isValid = false;
    if (isValid && val && rule.minLen && val.length < rule.minLen) isValid = false;
    if (isValid && val && rule.pattern && !rule.pattern.test(val)) isValid = false;

    input.classList.toggle('error', !isValid);
    input.classList.toggle('success', isValid && val.length > 0);
    if (errorEl) errorEl.classList.toggle('show', !isValid);

    return isValid;
  }

  /* Real-time validation on blur & input */
  Object.entries(rules).forEach(([name, rule]) => {
    const input = form.elements[name];
    if (input) {
      input.addEventListener('blur',  () => validateField(input, rule));
      input.addEventListener('input', () => {
        if (input.classList.contains('error')) validateField(input, rule);
      });
    }
  });

  /* Submit handler — sends to WhatsApp */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    /* Validate all fields */
    let firstInvalidInput = null;
    let allValid = true;

    Object.entries(rules).forEach(([name, rule]) => {
      const input = form.elements[name];
      if (input) {
        const valid = validateField(input, rule);
        if (!valid) {
          allValid = false;
          if (!firstInvalidInput) firstInvalidInput = input;
        }
      }
    });

    /* Also check email or phone is provided */
    const emailVal = form.elements.email ? form.elements.email.value.trim() : '';
    const phoneVal = form.elements.phone ? form.elements.phone.value.trim() : '';
    const emailErrorEl = document.getElementById('emailError');
    if (!emailVal && !phoneVal) {
      allValid = false;
      if (form.elements.email) {
        form.elements.email.classList.add('error');
        if (emailErrorEl) {
          emailErrorEl.textContent = 'Please enter an email or phone number.';
          emailErrorEl.classList.add('show');
        }
        if (!firstInvalidInput) firstInvalidInput = form.elements.email;
      }
    }

    if (!allValid) {
      if (firstInvalidInput) {
        firstInvalidInput.focus();
        firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    /* Extract form data */
    const firstName = form.elements.firstName ? form.elements.firstName.value.trim() : '';
    const lastName  = form.elements.lastName  ? form.elements.lastName.value.trim()  : '';
    const email     = emailVal || 'Not provided';
    const phone     = phoneVal || 'Not provided';
    const service   = form.elements.service ? form.elements.service.value : 'Not specified';
    const message   = form.elements.message ? form.elements.message.value.trim() : '';

    // 1. Dispatch email payload to Formspree
    sendLeadToFormspree('Contact Form Lead', {
      First_Name: firstName,
      Last_Name: lastName,
      Email: email,
      Phone: phone,
      Service_Requested: service,
      Client_Message: message
    });

    // 2. Build WhatsApp message backup
    const waText = [
      `Hello Lexi Crew Enterprises! 👋`,
      ``,
      `*Name:* ${firstName} ${lastName}`.trim(),
      `*Email:* ${email}`,
      `*Phone:* ${phone}`,
      `*Service:* ${service}`,
      ``,
      `*Message:*`,
      message,
    ].join('\n');

    const waURL = `https://wa.me/918667646502?text=${encodeURIComponent(waText)}`;

    /* Show success message */
    if (submitBtn) {
      submitBtn.classList.remove('loading');
    }
    if (form) form.style.display = 'none';
    if (formSuccess) formSuccess.classList.add('show');

    /* Open WhatsApp */
    window.open(waURL, '_blank', 'noopener,noreferrer') || (window.location.href = waURL);
  });
})();


/* ══════════════════════════════════════════
   7. NEWSLETTER FORM (Formspree Integration)
   ══════════════════════════════════════════ */
(function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  const msg = document.getElementById('newsletterMsg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.newsletter-btn');
    const input = form.querySelector('input');
    if (!input || !btn) return;

    const email = input.value.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      input.style.borderColor = '#EF4444';
      if (msg) {
        msg.textContent = 'Please enter a valid email address.';
        msg.className = 'newsletter-msg error';
      }
      return;
    }

    input.style.borderColor = '';
    btn.disabled = true;
    const origText = btn.textContent;
    btn.textContent = 'Subscribing...';

    // Dispatch payload to Formspree for instant Email Inbox delivery
    await sendLeadToFormspree('Newsletter Subscriber', { Subscriber_Email: email });

    btn.textContent = '✓ Subscribed';
    btn.style.background = '#10B981';

    if (msg) {
      msg.textContent = "Thank you for subscribing! Your email has been registered.";
      msg.className = 'newsletter-msg success';
    }

    input.value = '';

    setTimeout(() => {
      btn.textContent = origText;
      btn.style.background = '';
      btn.disabled = false;
      if (msg) msg.textContent = '';
    }, 4500);
  });
})();

// Global helper for company to view subscribers: run getNewsletterSubscribers() in browser console
window.getNewsletterSubscribers = function() {
  const subs = JSON.parse(localStorage.getItem('lexicrew_subscribers') || '[]');
  console.table(subs);
  return subs;
};


/* ══════════════════════════════════════════
   7.5 COOKIE CONSENT BANNER
   ══════════════════════════════════════════ */
(function initCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  const acceptBtn = document.getElementById('acceptCookies');
  const declineBtn = document.getElementById('declineCookies');

  if (!banner) return;

  // Show banner only if user hasn't decided yet
  if (!localStorage.getItem('cookieConsent')) {
    setTimeout(() => banner.classList.add('show'), 1000);
  }

  acceptBtn.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    banner.classList.remove('show');
  });

  declineBtn.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'declined');
    banner.classList.remove('show');
  });
})();


/* ══════════════════════════════════════════
   8. BACK TO TOP BUTTON
   ══════════════════════════════════════════ */
(function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', throttle(() => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, 100), { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();




/* ══════════════════════════════════════════
   9.5 FAQ ACCORDION
   ══════════════════════════════════════════ */
(function initFAQ() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  if (!faqQuestions.length) return;

  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const isExpanded = question.getAttribute('aria-expanded') === 'true';
      
      // Close all other open FAQs
      faqQuestions.forEach(q => {
        if (q !== question) {
          q.setAttribute('aria-expanded', 'false');
        }
      });
      
      // Toggle the clicked FAQ
      question.setAttribute('aria-expanded', !isExpanded);
    });
  });
})();


/* ══════════════════════════════════════════
   10. PORTFOLIO CARD — CSS transition fix
      (ensure opacity is set initially)
   ══════════════════════════════════════════ */
document.querySelectorAll('.portfolio-card').forEach(card => {
  card.style.opacity = '1';
  card.style.transform = 'scale(1)';
  card.style.transition = 'opacity 0.3s ease, transform 0.3s ease, border-color 0.35s ease, box-shadow 0.35s ease';
});


/* ══════════════════════════════════════════
   11. HERO VIDEO — 3D Mouse Tilt + Sheen
   ══════════════════════════════════════════ */
(function initHero3DTilt() {
  const card   = document.getElementById('hero3dCard');
  const sheen  = document.getElementById('hero3dSheen');
  const shadow = document.getElementById('hero3dShadow');
  if (!card) return;

  const MAX_TILT  = 14;  // degrees
  const SCALE_ON  = 1.04;

  let raf = null;
  let targetRX = 0, targetRY = 0, targetSX = 0, targetSY = 0;
  let currentRX = 0, currentRY = 0;
  let isHovered = false;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function tick() {
    // Smooth interpolation towards target
    currentRX = lerp(currentRX, targetRX, 0.12);
    currentRY = lerp(currentRY, targetRY, 0.12);

    card.style.transform = isHovered
      ? `perspective(1200px) rotateX(${currentRX}deg) rotateY(${currentRY}deg) scale(${SCALE_ON})`
      : '';

    // Shift shadow depth based on tilt
    if (shadow) {
      const shadowX = currentRY * 0.8;
      const shadowScale = 0.85 + Math.abs(currentRX) * 0.015;
      shadow.style.transform = `rotateX(85deg) translateX(${shadowX}px) scale(${shadowScale})`;
      shadow.style.opacity = isHovered ? '1' : '0.85';
    }

    raf = requestAnimationFrame(tick);
  }

  card.addEventListener('mouseenter', () => {
    isHovered = true;
    card.classList.remove('is-idle');
    card.classList.add('is-hovered');
    if (sheen) sheen.style.opacity = '1';
    raf = requestAnimationFrame(tick);
  });

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = (e.clientX - cx) / (rect.width  / 2); // -1 to 1
    const dy   = (e.clientY - cy) / (rect.height / 2); // -1 to 1

    targetRY =  dx * MAX_TILT;
    targetRX = -dy * MAX_TILT;

    // Move sheen radial highlight to cursor position
    if (sheen) {
      const px = ((e.clientX - rect.left) / rect.width)  * 100;
      const py = ((e.clientY - rect.top)  / rect.height) * 100;
      sheen.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.30) 0%, transparent 60%)`;
    }
  });

  card.addEventListener('mouseleave', () => {
    isHovered = false;
    targetRX = 0;
    targetRY = 0;

    // Let interpolation settle back, then restore idle float
    setTimeout(() => {
      if (!isHovered) {
        cancelAnimationFrame(raf);
        raf = null;
        card.style.transform = '';
        card.classList.remove('is-hovered');
        card.classList.add('is-idle');
        if (sheen) sheen.style.opacity = '0';
        if (shadow) {
          shadow.style.transform = 'rotateX(85deg) translateZ(-30px)';
          shadow.style.opacity   = '0.85';
        }
      }
    }, 450);
  });
})();


/* ══════════════════════════════════════════
   12. WHATSAPP — Business Hours Online Dot
   ══════════════════════════════════════════ */
(function initWAOnlineDot() {
  const dot = document.getElementById('waOnlineDot');
  if (!dot) return;

  function isBusinessHours() {
    // IST = UTC+5:30
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 5.5 * 3600000);
    const h   = ist.getHours();
    return h >= 7 && h < 20; // 7AM–8PM IST
  }

  if (isBusinessHours()) {
    dot.classList.add('visible');
  }
})();


/* ══════════════════════════════════════════
   13. REQUEST A CALL — Drawer
   ══════════════════════════════════════════ */
(function initRCallDrawer() {
  const floatBtn    = document.getElementById('rcallFloatBtn');
  const overlay     = document.getElementById('rcallOverlay');
  const drawer      = document.getElementById('rcallDrawer');
  const closeBtn    = document.getElementById('rcallDrawerClose');
  const form        = document.getElementById('rcallForm');
  const submitBtn   = document.getElementById('rcallSubmitBtn');
  const successEl   = document.getElementById('rcallSuccess');
  const serviceEl   = document.getElementById('rcallService');

  if (!floatBtn || !drawer) return;

  function openDrawer(preService) {
    drawer.removeAttribute('aria-hidden');
    drawer.classList.add('open');
    overlay.classList.add('open');
    overlay.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    // Pre-select service if provided
    if (preService && serviceEl) {
      for (const opt of serviceEl.options) {
        if (opt.value === preService) { opt.selected = true; break; }
      }
    }
    // Focus first field
    const firstInput = drawer.querySelector('input, select, textarea');
    setTimeout(() => firstInput && firstInput.focus(), 350);
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  floatBtn.addEventListener('click', () => openDrawer());
  closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
  });

  // Expose openDrawer globally for service quote buttons
  window.openRCallDrawer = openDrawer;

  /* — Form Validation & Submission — */
  function validateField(fieldEl, errorEl, isValid) {
    const wrap = fieldEl.closest('.rcall-field');
    if (isValid) {
      wrap.classList.remove('has-error');
      fieldEl.classList.remove('invalid');
    } else {
      wrap.classList.add('has-error');
      fieldEl.classList.add('invalid');
    }
    return isValid;
  }

  form && form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameEl  = document.getElementById('rcallName');
    const phoneEl = document.getElementById('rcallPhone');
    const noteEl  = document.getElementById('rcallMsg');
    const timeEl  = document.querySelector('input[name="rcallTime"]:checked');
    let valid = true;

    valid = validateField(nameEl,  document.getElementById('rcallNameErr'),
      nameEl.value.trim().length >= 2) && valid;

    valid = validateField(phoneEl, document.getElementById('rcallPhoneErr'),
      /^[6-9]\d{9}$/.test(phoneEl.value.trim())) && valid;

    if (!valid) return;

    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // Dispatch lead payload to Formspree for instant Email Inbox delivery
    await sendLeadToFormspree('Request a Call', {
      Caller_Name: nameEl ? nameEl.value.trim() : '',
      Phone_Number: phoneEl ? phoneEl.value.trim() : '',
      Preferred_Time: timeEl ? timeEl.value : 'Anytime',
      Notes: noteEl ? noteEl.value.trim() : ''
    });

    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;

    // Show success modal
    form.style.display = 'none';
    successEl.setAttribute('aria-hidden', 'false');

    // Reset checkmark animations by removing/re-adding
    const circle = successEl.querySelector('.rcall-checkmark-circle');
    const check  = successEl.querySelector('.rcall-checkmark-check');
    if (circle) { circle.style.animation = 'none'; requestAnimationFrame(() => { circle.style.animation = ''; }); }
    if (check)  { check.style.animation  = 'none'; requestAnimationFrame(() => { check.style.animation  = ''; }); }
  });

  // Live validation on blur
  const nameEl  = document.getElementById('rcallName');
  const phoneEl = document.getElementById('rcallPhone');
  nameEl  && nameEl.addEventListener('blur',  () => validateField(nameEl,  null, nameEl.value.trim().length >= 2));
  phoneEl && phoneEl.addEventListener('blur', () => validateField(phoneEl, null, /^[6-9]\d{9}$/.test(phoneEl.value.trim())));
})();


/* ══════════════════════════════════════════
   14. SERVICE CARD — Quick Quote Buttons
   ══════════════════════════════════════════ */
(function initServiceQuoteBtns() {
  document.querySelectorAll('.service-quote-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const service = btn.dataset.service || '';
      if (typeof window.openRCallDrawer === 'function') {
        window.openRCallDrawer(service);
      }
    });
  });
})();


/* ══════════════════════════════════════════
   15. STICKY BOTTOM CTA BAR
   ══════════════════════════════════════════ */
(function initStickyCTABar() {
  const bar        = document.getElementById('stickyCtaBar');
  const dismissBtn = document.getElementById('stickyCtaDismiss');
  const callBtn    = document.getElementById('stickyCtaCallBtn');
  if (!bar) return;

  if (sessionStorage.getItem('stickyCtaDismissed')) return;

  const heroSection = document.getElementById('home');

  const onScroll = throttle(() => {
    if (!heroSection) return;
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    if (heroBottom < 0) {
      bar.classList.add('visible');
      bar.setAttribute('aria-hidden', 'false');
    } else {
      bar.classList.remove('visible');
      bar.setAttribute('aria-hidden', 'true');
    }
  }, 150);

  window.addEventListener('scroll', onScroll, { passive: true });

  dismissBtn && dismissBtn.addEventListener('click', () => {
    bar.classList.remove('visible');
    bar.setAttribute('aria-hidden', 'true');
    sessionStorage.setItem('stickyCtaDismissed', 'true');
    window.removeEventListener('scroll', onScroll);
  });

  callBtn && callBtn.addEventListener('click', () => {
    if (typeof window.openRCallDrawer === 'function') window.openRCallDrawer();
  });
})();


/* ══════════════════════════════════════════
   16. EXIT INTENT POPUP
   ══════════════════════════════════════════ */
(function initExitIntent() {
  const modal      = document.getElementById('exitModal');
  const overlay    = document.getElementById('exitOverlay');
  const closeBtn   = document.getElementById('exitModalClose');
  const dismissBtn = document.getElementById('exitDismissBtn');
  const ctaBtn     = document.getElementById('exitCtaBtn');
  if (!modal) return;

  // Don't show if already shown this session
  if (sessionStorage.getItem('exitIntentShown')) return;

  let triggered = false;
  const startTime = Date.now();

  function openModal() {
    if (triggered) return;
    // Dwell time: require at least 10 seconds on page before exit intent triggers
    if (Date.now() - startTime < 10000) return;

    triggered = true;
    sessionStorage.setItem('exitIntentShown', 'true');
    modal.classList.add('open');
    overlay.classList.add('open');
    modal.removeAttribute('aria-hidden');
    overlay.removeAttribute('aria-hidden');
  }

  function closeModal() {
    modal.classList.remove('open');
    overlay.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
  }

  // Trigger on mouse leaving viewport from top
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY <= 5) openModal();
  });

  closeBtn   && closeBtn.addEventListener('click', closeModal);
  dismissBtn && dismissBtn.addEventListener('click', closeModal);
  overlay    && overlay.addEventListener('click', closeModal);

  ctaBtn && ctaBtn.addEventListener('click', () => {
    closeModal();
    setTimeout(() => {
      if (typeof window.openRCallDrawer === 'function') window.openRCallDrawer();
    }, 350);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
})();
