// === INLINE SCRIPT 0 ===
!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);

// === INLINE SCRIPT 1 ===
document.addEventListener('DOMContentLoaded', () => {
    // === Booking Modal: Trigger & Prefill ===
    (function () {
      'use strict';

      const SELECTORS = {
        modal: '[data-booking-modal]',
        openTrigger: '[data-book-trigger]',
        closeTrigger: '[data-booking-close]',
        form: '[data-booking-form]',
      };

      const modal = document.querySelector(SELECTORS.modal);
      if (!modal) return;

      const form = modal.querySelector(SELECTORS.form);
      if (!form) return;

      let lastFocusedEl = null;
      let titleSplit = null; // cached SplitText instance — created once, replayed on each open

      const getRadio = (groupName, value) => {
        if (!value) return null;
        return form.querySelector(`input[name="${groupName}"][value="${CSS.escape(value)}"]`);
      };

      const prefillFromTrigger = (trigger) => {
        const treatmentValue = trigger.dataset.bookTreatment || '';
        const doctorValue = trigger.dataset.bookDoctor || '';

        const treatmentRadio = getRadio('treatment', treatmentValue);
        if (treatmentRadio) {
          treatmentRadio.checked = true;
          treatmentRadio.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const doctorRadio = getRadio('doctor', doctorValue);
        if (doctorRadio) {
          doctorRadio.checked = true;
          doctorRadio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };

      // --- Open animation ---
      const animateModalOpen = () => {
        if (typeof gsap === 'undefined') return;

        const overlay = modal.querySelector('.booking-modal__overlay');
        const box = modal.querySelector('[data-modal-anim="box"]');
        const titleEl = modal.querySelector('[data-modal-anim="title"]');
        const items = modal.querySelectorAll('[data-modal-anim="item"]');
        const cards = modal.querySelectorAll('[data-modal-anim="card"]');

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReduced) {
          gsap.set([overlay, box, ...items, ...cards].filter(Boolean), {
            opacity: 1,
            y: 0,
          });
          if (titleEl) gsap.set(titleEl, { opacity: 1 });
          return;
        }

        if (overlay) gsap.set(overlay, { opacity: 0 });
        if (box) gsap.set(box, { opacity: 0 });
        gsap.set(items, { opacity: 0, y: 24 });
        gsap.set(cards, { opacity: 0, y: 16 });
        if (titleEl) gsap.set(titleEl, { opacity: 1 });

        const tl = gsap.timeline();

        if (overlay) {
          tl.to(overlay, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0);
        }

        if (box) {
          tl.to(box, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0.05);
        }

        // Title: re-split fresh on every open — modal was just switched to
        // display:flex, so this is the first correct measurement. autoSplit
        // is intentionally OFF here: its resize-observer would re-split
        // shortly after (triggered by the display:none -> flex change itself)
        // and orphan the very elements we just started animating.
        if (titleEl && window.SplitText) {
          if (titleSplit) {
            titleSplit.revert();
            titleSplit = null;
          }

          titleSplit = SplitText.create(titleEl, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'split-lines',
            autoSplit: false,
          });

          gsap.set(titleSplit.lines, { yPercent: 110, opacity: 0 });
          tl.to(
            titleSplit.lines,
            {
              yPercent: 0,
              opacity: 1,
              duration: 1.1,
              ease: 'expo.out',
              stagger: 0.08,
            },
            0.35,
          );
        }

        if (items.length) {
          tl.to(items, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.09 }, 0.35);
        }

        if (cards.length) {
          tl.to(cards, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.05 }, 0.55);
        }
      };

      const openModal = (trigger) => {
        lastFocusedEl = document.activeElement;

        if (trigger) {
          prefillFromTrigger(trigger);
        }

        modal.classList.add('is-open');
        document.documentElement.classList.add('has-open-modal');

        animateModalOpen();

        const closeBtn = modal.querySelector(SELECTORS.closeTrigger);
        if (closeBtn) closeBtn.focus();

        document.addEventListener('keydown', handleKeydown);
      };

      const closeModal = () => {
        modal.classList.remove('is-open');
        document.documentElement.classList.remove('has-open-modal');

        document.removeEventListener('keydown', handleKeydown);

        if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
          lastFocusedEl.focus();
        }
      };

      const handleKeydown = (e) => {
        if (e.key === 'Escape') {
          closeModal();
        }
      };

      document.addEventListener('click', (e) => {
        const openBtn = e.target.closest(SELECTORS.openTrigger);
        if (openBtn) {
          e.preventDefault();
          openModal(openBtn);
          return;
        }

        const closeBtn = e.target.closest(SELECTORS.closeTrigger);
        if (closeBtn) {
          e.preventDefault();
          closeModal();
        }
      });

      window.__bookingModal = { open: openModal, close: closeModal };
    })();

    // === Booking Modal: Stepper & Validation ===
    (function () {
      'use strict';

      if (typeof jQuery === 'undefined' || typeof jQuery.fn.validate === 'undefined') {
        console.error('jQuery или jQuery Validate не подключены');
        return;
      }

      const form = document.querySelector('[data-booking-form]');
      if (!form) return;

      const $form = $(form);

      const formSteps = form.querySelectorAll('[data-step]');
      const tabSteps = document.querySelectorAll('[data-tab-step]');

      const nextBtnStep1 = form.querySelector('[data-next-step="2"]');
      const backBtnStep2 = form.querySelector('[data-prev-step="1"]');
      const submitBtn = form.querySelector('button[type="submit"]');

      const treatmentInputs = form.querySelectorAll('input[name="treatment"]');
      const doctorInputs = form.querySelectorAll('input[name="doctor"]');

      let currentStep = 1;

      // --- Step 1 validation: both radio groups must have a checked value ---
      const isRadioGroupValid = (inputs) => Array.from(inputs).some((input) => input.checked);

      const validateStep1 = () => {
        const valid = isRadioGroupValid(treatmentInputs) && isRadioGroupValid(doctorInputs);
        if (nextBtnStep1) {
          nextBtnStep1.disabled = !valid;
        }
        return valid;
      };

      treatmentInputs.forEach((input) => input.addEventListener('change', validateStep1));
      doctorInputs.forEach((input) => input.addEventListener('change', validateStep1));

      // --- jQuery Validate for step 2 fields ---
      $form.validate({
        ignore: ':hidden, [data-step]:not(.is-active-step) *',
        rules: {
          Name: { required: true, minlength: 2 },
          Email: { required: true, email: true },
          Phone: { required: true, minlength: 6 },
        },
        messages: {
          Name: {
            required: 'Please enter your full name',
            minlength: 'Name must be at least 2 characters',
          },
          Email: {
            required: 'Please enter your email',
            email: 'Please enter a valid email address',
          },
          Phone: {
            required: 'Please enter your mobile number',
            minlength: 'Please enter a valid mobile number',
          },
        },
        errorPlacement: function (error, element) {
          error.insertAfter(element);
        },
        highlight: function (element) {
          $(element).addClass('error-input');
        },
        unhighlight: function (element) {
          $(element).removeClass('error-input');
        },
      });

      // --- Step switching ---
      const switchToStep = (stepNumber) => {
        formSteps.forEach((step) => {
          step.style.display = 'none';
          step.classList.remove('is-active-step');
        });

        const targetStep = form.querySelector(`[data-step="${stepNumber}"]`);
        if (targetStep) {
          targetStep.style.display = 'flex';
          targetStep.classList.add('is-active-step');
        }

        tabSteps.forEach((tab, index) => {
          const tabNumber = index + 1;
          tab.classList.remove('is-active');

          if (tabNumber === stepNumber) {
            tab.classList.add('is-active');
          }

          tabSteps.forEach((tab, index) => {
            const tabNumber = index + 1;
            tab.classList.remove('is-active');

            if (tabNumber === stepNumber) {
              tab.classList.add('is-active');
              tab.classList.remove('is-done'); // текущий шаг никогда не "done"
            } else if (tabNumber < stepNumber) {
              tab.classList.add('is-done');
            } else {
              tab.classList.remove('is-done');
            }
          });
        });

        currentStep = stepNumber;
      };

      // --- Reset form to initial state (called on modal close, optional reuse) ---
      const resetForm = () => {
        form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea').forEach((input) => {
          input.value = '';
        });

        form.querySelectorAll('input[type="radio"]').forEach((input) => {
          input.checked = false;
        });

        $form.validate().resetForm();
        form.querySelectorAll('.error-input').forEach((el) => {
          el.classList.remove('error-input');
        });

        tabSteps.forEach((tab) => tab.classList.remove('is-done'));

        validateStep1();
        switchToStep(1);
      };

      // --- Init ---
      validateStep1();
      switchToStep(1);

      // Step 1 -> Step 2
      if (nextBtnStep1) {
        nextBtnStep1.addEventListener('click', () => {
          if (validateStep1()) {
            switchToStep(2);
          }
        });
      }

      // Step 2 -> Step 1
      if (backBtnStep2) {
        backBtnStep2.addEventListener('click', () => {
          switchToStep(1);
        });
      }

      // Step 2 submit -> Step 3 (no real submission, static prototype)
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!$form.valid()) {
          return;
        }

        switchToStep(3);
      });

      // Reset form whenever modal closes (so reopening starts fresh)
      document.addEventListener('click', (e) => {
        if (e.target.closest('[data-booking-close]')) {
          // slight delay so close animation/logic in Module 1 runs first
          setTimeout(resetForm, 0);
        }
      });
    })();

    // === Booking Modal: Phone Input Mask ===
    (function () {
      'use strict';

      const phoneInputs = document.querySelectorAll('[data-input-phone]');
      if (!phoneInputs.length) return;

      if (typeof Inputmask === 'undefined') {
        console.error('Inputmask не подключен');
        return;
      }

      const phoneMask = new Inputmask({
        mask: '+9{1,3}9999999999[99][99]',
        showMaskOnHover: false,
        showMaskOnFocus: true,
        clearIncomplete: false,
        greedy: false,
        placeholder: ' ',
        definitions: {
          9: { validator: '[0-9]', cardinality: 1, definitionSymbol: '9' },
        },
      });

      let masked = false;

      const applyMask = () => {
        if (masked) return;
        phoneInputs.forEach((input) => phoneMask.mask(input));
        masked = true;
      };

      const modal = document.querySelector('[data-booking-modal]');
      if (modal) {
        const observer = new MutationObserver(() => {
          if (modal.classList.contains('is-open')) {
            applyMask();
          }
        });
        observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
      }
    })();
  });

// === INLINE SCRIPT 2 ===
document.addEventListener('DOMContentLoaded', () => {
    /* STAGGER LINK ANIM */
    function initStaggerLinks() {
      const links = document.querySelectorAll('[data-stagger-link]');
      if (!links.length) return;

      const isDesktop = () => window.innerWidth >= 480 && matchMedia('(hover: hover) and (pointer: fine)').matches;

      if (!isDesktop()) return;

      let mm = gsap.matchMedia();

      mm.add('(min-width: 480px) and (hover: hover) and (pointer: fine)', () => {
        let splitText;
        function runSplit() {
          splitText = new SplitText('[data-stagger-link]', {
            type: 'words, chars',
            wordsClass: 'split-word',
            charsClass: 'split-char',
            autoSplit: true,
          });
        }
        runSplit();

        // ————— Update on window resize
        let windowWidth = $(window).innerWidth();
        window.addEventListener('resize', function () {
          if (windowWidth !== $(window).innerWidth()) {
            windowWidth = $(window).innerWidth();
            splitText.revert();
            runSplit();
          }
        });

        // ————— Animation
        links.forEach((link) => {
          link.addEventListener('mouseenter', function () {
            const letters = link.querySelectorAll('[data-stagger-link-text] .split-char');
            gsap.to(letters, {
              yPercent: -110,
              duration: 0.35,
              ease: 'power4.inOut',
              stagger: { amount: 0.2, from: 'start' },
              overwrite: true,
            });
          });
          link.addEventListener('mouseleave', function () {
            const letters = link.querySelectorAll('[data-stagger-link-text] .split-char');
            gsap.to(letters, {
              yPercent: 0,
              duration: 0.25,
              ease: 'power4.inOut',
              stagger: { amount: 0.2, from: 'end' },
              overwrite: true,
            });
          });
        });

        return () => {
          splitText.revert();
        };
      });
    }
    initStaggerLinks();
  });

// === INLINE SCRIPT 3 ===
document.addEventListener('DOMContentLoaded', () => {
    // === Header Intro ===
    (function () {
      'use strict';

      const header = document.querySelector('[data-header]');
      if (!header) return;

      const logo = header.querySelector('[data-header="logo"]');
      const navItems = header.querySelectorAll('[data-header="nav-item"]');
      const ctas = header.querySelectorAll('[data-header="cta"]');

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced) {
        gsap.set([logo, ...navItems, ...ctas].filter(Boolean), { opacity: 1, y: 0 });
        return;
      }

      function playHeaderIntro() {
        const tl = gsap.timeline({
          defaults: { ease: 'power3.out', duration: 0.7 },
        });

        if (logo) tl.to(logo, { opacity: 1, y: 0 }, 0);
        if (navItems.length) {
          tl.to(navItems, { opacity: 1, y: 0, stagger: 0.06 }, 0.15);
        }
        if (ctas.length) {
          tl.to(ctas, { opacity: 1, y: 0, stagger: 0.06 }, 0.45);
        }
      }

      document.fonts.ready.then(playHeaderIntro).catch(playHeaderIntro);
    })();

    // === Hero Intro ===
    (function () {
      'use strict';

      const hero = document.querySelector('[data-hero]');
      if (!hero) return;

      const bg = hero.querySelector('[data-hero="bg"]');
      const titleEl = hero.querySelector('[data-hero="title"]');
      const ctaText = hero.querySelector('[data-hero="cta-text"]');
      const ctaBtn = hero.querySelector('[data-hero="cta-btn"]');
      const header = document.querySelector('.header');

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Respect reduced motion: skip straight to the resting state, no animation
      if (prefersReduced) {
        gsap.set([bg, ctaText, ctaBtn].filter(Boolean), { y: 0, scale: 1 });
        if (titleEl) gsap.set(titleEl, { opacity: 1 });
        return;
      }

      // Background parallax on scroll (independent of the intro timeline)
      if (bg) {
        gsap.to(bg, {
          yPercent: 15,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

      function playIntro() {
        // Background: slow zoom-out + fade in
        if (bg) {
          gsap.to(bg, {
            scale: 1,
            duration: 1.8,
            ease: 'power2.out',
          });
        }

        // Title: line-by-line mask reveal. autoSplit re-splits (and re-animates)
        // on resize/breakpoint changes, which fits the fluid rem layout here.
        if (titleEl) {
          gsap.set(titleEl, { opacity: 1 });
          if (window.SplitText) {
            SplitText.create(titleEl, {
              type: 'lines',
              mask: 'lines',
              linesClass: 'split-lines',
              autoSplit: true,
              onSplit(self) {
                return gsap.from(self.lines, {
                  yPercent: 110,
                  opacity: 0,
                  duration: 1.1,
                  ease: 'expo.out',
                  stagger: 0.08,
                  delay: 0.4,
                });
              },
            });
          }
        }

        // CTA: paragraph then button, staggered in after the title
        const ctaTl = gsap.timeline({
          delay: 1.1,
          defaults: { ease: 'power3.out', duration: 0.9 },
        });
        if (ctaText) ctaTl.to(ctaText, { y: 0, opacity: 1 }, 0);

        if (ctaBtn) {
          ctaTl.to(ctaBtn, { y: 0, opacity: 1 }, 0.1);
          const btnParts = ctaBtn.querySelectorAll(':scope > div');
          if (btnParts.length) {
            ctaTl.from(btnParts, { yPercent: 60, opacity: 0, duration: 0.5, stagger: 0.05 }, 0.2);
          }
        }
      }

      document.fonts.ready.then(playIntro).catch(playIntro);
    })();
  });

// === INLINE SCRIPT 4 ===
document.addEventListener('DOMContentLoaded', () => {
    // === Intro (About) Animations ===
    (function () {
      'use strict';

      const section = document.querySelector('[data-about]');
      if (!section) return;

      const caption = section.querySelector('[data-about="caption"]');
      const titleEl = section.querySelector('[data-about="title"]');
      const img = section.querySelector('[data-about="img"]');
      const circleIcn = section.querySelector('[data-about="circle-icn"]');
      const text = section.querySelector('[data-about="text"]');

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced) {
        gsap.set([caption, img, circleIcn, text].filter(Boolean), {
          opacity: 1,
          y: 0,
          scale: 1,
        });
        return;
      }

      if (caption) {
        gsap.to(caption, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: caption, start: 'top 85%' },
        });
      }

      if (img) {
        gsap.to(img, {
          scale: 1,
          duration: 1.4,
          ease: 'power2.out',
          scrollTrigger: { trigger: img, start: 'top 95%' },
        });
      }

      if (circleIcn || text) {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: text || circleIcn, start: 'top 88%' },
          defaults: { ease: 'power3.out', duration: 0.8 },
        });
        if (circleIcn) tl.to(circleIcn, { opacity: 1, scale: 1 }, 0);
        if (text) tl.to(text, { opacity: 1, y: 0 }, 0.1);
      }

      // Title: same line-by-line mask reveal pattern as the hero
      if (titleEl) {
        gsap.set(titleEl, { opacity: 1 });
        if (window.SplitText) {
          SplitText.create(titleEl, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'split-lines',
            autoSplit: true,
            onSplit(self) {
              return gsap.from(self.lines, {
                yPercent: 110,
                opacity: 0,
                duration: 1.1,
                ease: 'expo.out',
                stagger: 0.08,
                scrollTrigger: {
                  trigger: titleEl,
                  start: 'top 80%',
                },
              });
            },
          });
        }
      }
    })();
  });

// === INLINE SCRIPT 5 ===
document.addEventListener('DOMContentLoaded', () => {
    function createSplideSlider({
      selector,
      autoWidth = false,
      perPageDesktop = 1,
      desktopGap = null,
      mobileGap = null,
      trimSpace = true,
      destroy = false,
      showPagination = true,
      loop = false,
      type = null, // 'fade' | 'loop' | 'slide'
      rewind = false,
      paginationFormat = '{current}/{total}',
      hideNavIfNotEnoughSlides = false,
      minWidthToCheck = 992,
      excludeFromMobile = null,
    }) {
      const sliderEl = document.querySelector(selector);
      if (!sliderEl) return;

      const parent = sliderEl.closest('[data-slider-wrap]') || sliderEl.parentElement;
      const prev = parent.querySelector('[data-slider-btn-prev]');
      const next = parent.querySelector('[data-slider-btn-next]');
      const paginationEl = parent.querySelector('[data-slider-counter]');
      const navigationEl = parent.querySelector('[data-slider-nav]');

      // --------------------------------
      const track = sliderEl.querySelector(':scope > .splide__track');
      const list = sliderEl.querySelector('.splide__list');

      if (!track || !list) {
        sliderEl.style.visibility = 'visible';
        if (navigationEl) navigationEl.style.display = 'none';
        if (paginationEl) paginationEl.textContent = '';
        return null;
      }

      const slides = list.querySelectorAll('.splide__slide');
      if (!slides.length) {
        sliderEl.style.visibility = 'visible';
        if (navigationEl) navigationEl.style.display = 'none';
        if (paginationEl) paginationEl.textContent = '';
        return null;
      }
      // --------------------------------

      let slider;
      try {
        const resolvedType = type || (loop ? 'loop' : 'slide');

        if (excludeFromMobile && window.matchMedia('(max-width: 479px)').matches) {
          sliderEl.querySelectorAll(excludeFromMobile).forEach((el) => {
            el.classList.remove('splide__slide');
          });
        }

        slider = new Splide(sliderEl, {
          autoWidth,
          perPage: 1,
          flickPower: 500,
          arrows: false,
          pagination: showPagination,
          trimSpace,
          omitEnd: resolvedType === 'fade' ? false : true,
          focus: 0,
          rewind,
          type: resolvedType,
          mediaQuery: 'min',
          breakpoints: {
            480: {
              ...(destroy && { destroy }),
              ...(desktopGap && { gap: desktopGap }),
              ...(perPageDesktop && { perPage: perPageDesktop }),
            },
          },
          ...(mobileGap && { gap: mobileGap }),
        });
      } catch (err) {
        console.error('Splide init failed for', selector, err);
        sliderEl.style.visibility = 'visible';
        if (navigationEl) navigationEl.style.display = 'none';
        if (paginationEl) paginationEl.textContent = '';
        return null;
      }

      function padNumber(num) {
        return num < 10 ? `0${num}` : `${num}`;
      }

      function getTotalSlides() {
        return slider.length;
      }

      function getCurrentSlide() {
        const idx = slider.index;
        const perPage = slider.options.perPage || 1;
        const total = getTotalSlides();
        return Math.min(idx + perPage, total);
      }

      function updatePagination() {
        if (!paginationEl) return;
        const current = padNumber(getCurrentSlide());
        const total = padNumber(getTotalSlides());
        paginationEl.textContent = paginationFormat.replace('{current}', current).replace('{total}', total);
      }

      function updateArrows() {
        if (loop || rewind) {
          prev && (prev.disabled = false);
          next && (next.disabled = false);
          return;
        }
        const idx = slider.index;
        const last = slider.Components.Controller.getEnd();
        prev && (prev.disabled = idx === 0);
        next && (next.disabled = idx === last);
      }

      function toggleNavVisibility() {
        if (!hideNavIfNotEnoughSlides || !navigationEl) return;
        const isWide = window.innerWidth >= minWidthToCheck;
        const slidesCount = getTotalSlides();
        const shouldHideNav = (isWide && slidesCount <= perPageDesktop) || (!isWide && slidesCount <= 1);
        navigationEl.style.display = shouldHideNav ? 'none' : 'flex';
      }

      slider.on('mounted move moved resize refresh', () => {
        updateArrows();
        updatePagination();
        toggleNavVisibility();
      });

      // Страховка: если mounted по какой-то причине не сработает, всё равно
      // снимаем visibility, чтобы контент не пропал молча
      const fallbackTimer = setTimeout(() => {
        if (getComputedStyle(sliderEl).visibility === 'hidden') {
          sliderEl.style.visibility = 'visible';
        }
      }, 1500);
      slider.on('mounted', () => clearTimeout(fallbackTimer));

      prev && prev.addEventListener('click', () => slider.go('<'));
      next && next.addEventListener('click', () => slider.go('>'));

      slider.mount();
      window.addEventListener('resize', toggleNavVisibility);

      return slider;
    }

    createSplideSlider({
      selector: '.testimonials__splide',
      autoWidth: false,
      perPageDesktop: 1,
      desktopGap: '2rem',
      mobileGap: '2rem',
      trimSpace: true,
      loop: false,
      hideNavIfNotEnoughSlides: true,
      minWidthToCheck: 0,
      destroy: true,
      excludeFromMobile: '.splide__slide.is-img-1, .splide__slide.is-img-2',
    });

    createSplideSlider({
      selector: '.team__splide',
      autoWidth: false,
      perPageDesktop: 1,
      desktopGap: '2rem',
      mobileGap: '2rem',
      trimSpace: true,
      loop: false,
      type: 'fade',
      hideNavIfNotEnoughSlides: true,
      minWidthToCheck: 0,
    });
  });

// === INLINE SCRIPT 6 ===
document.addEventListener('DOMContentLoaded', () => {
    function servicesDropdown() {
      const $dropdowns = $('[data-dropdown]');
      const $dropdownToggles = $('[data-dropdown-toggle]');
      const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

      // Инициализация ARIA атрибутов
      function initAriaAttributes() {
        $dropdowns.each(function (index) {
          const $dropdown = $(this);
          const $toggle = $dropdown.find('[data-dropdown-toggle]');
          const $list = $dropdown.find('[data-dropdown-list]');
          const toggleId = `faq-toggle-${index}`;
          const listId = `faq-dropdown-${index}`;
          $toggle.attr({
            id: toggleId,
            'aria-expanded': 'false',
            'aria-controls': listId,
          });
          $list.attr({
            id: listId,
            role: 'region',
            'aria-labelledby': toggleId,
          });
        });
      }

      // Обновление ARIA атрибутов
      function updateAriaAttributes($dropdown, isActive) {
        $dropdown.find('[data-dropdown-toggle]').attr('aria-expanded', isActive ? 'true' : 'false');
      }

      function closeDropdown($dropdown) {
        if (!$dropdown.hasClass('active')) return;
        $dropdown.removeClass('active');
        $dropdown.find('[data-dropdown-list]').stop(true, true).slideUp('300');
        updateAriaAttributes($dropdown, false);
      }

      function closeAllExcept($except) {
        $dropdowns.not($except).each(function () {
          closeDropdown($(this));
        });
      }

      function openDropdown($dropdown) {
        if ($dropdown.hasClass('active')) return;
        closeAllExcept($dropdown);
        $dropdown.addClass('active');
        $dropdown.find('[data-dropdown-list]').stop(true, true).slideDown(350);
        updateAriaAttributes($dropdown, true);
      }

      function toggleDropdown($dropdown) {
        $dropdown.hasClass('active') ? closeDropdown($dropdown) : openDropdown($dropdown);
      }

      // Клик/тап
      // Десктоп (hover доступен): toggle уже открывается по hover,
      // клик по ссылке должен просто перейти по href — preventDefault не вызываем.
      // Touch/клавиатура (hover недоступен): клик управляет дропдауном, переход блокируем.
      $dropdownToggles.on('click', function (e) {
        if (hoverQuery.matches) {
          // Десктоп: даём ссылке отработать переход как обычно
          return;
        }
        e.preventDefault();
        const $dropdown = $(this).parent('[data-dropdown]');
        toggleDropdown($dropdown);
      });

      // Hover — только для устройств, которые реально поддерживают наведение
      function bindHover() {
        $dropdowns.off('mouseenter.dropdownHover mouseleave.dropdownHover');

        if (!hoverQuery.matches) return;

        let closeTimeout;

        $dropdowns.on('mouseenter.dropdownHover', function () {
          clearTimeout(closeTimeout);
          openDropdown($(this));
        });

        $dropdowns.on('mouseleave.dropdownHover', function () {
          const $dropdown = $(this);
          closeTimeout = setTimeout(function () {
            closeDropdown($dropdown);
          }, 150);
        });
      }

      bindHover();

      // Пересчитываем при смене типа устройства (например, ноутбук с тачскрином + мышь)
      if (hoverQuery.addEventListener) {
        hoverQuery.addEventListener('change', bindHover);
      } else if (hoverQuery.addListener) {
        hoverQuery.addListener(bindHover);
      }

      initAriaAttributes();
    }

    mm.add('(min-width: 480px)', () => {
      servicesDropdown();
    });

    // === Services Animations ===
    (function () {
      'use strict';

      const section = document.querySelector('[data-services]');
      if (!section) return;

      const caption = section.querySelector('[data-services="caption"]');
      const titleEl = section.querySelector('[data-services="title"]');
      const subtitle = section.querySelector('[data-services="subtitle"]');
      const cards = gsap.utils.toArray(section.querySelectorAll('[data-service-card]'));

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced) {
        gsap.set([caption, subtitle, ...cards].filter(Boolean), { opacity: 1, y: 0, scale: 1 });
        if (titleEl) gsap.set(titleEl, { opacity: 1 });
        return;
      }

      if (caption) {
        gsap.to(caption, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: caption, start: 'top 85%' },
        });
      }

      // Title: same line-by-line mask reveal pattern as hero/intro
      if (titleEl) {
        gsap.set(titleEl, { opacity: 1 });
        if (window.SplitText) {
          SplitText.create(titleEl, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'split-lines',
            autoSplit: true,
            onSplit(self) {
              return gsap.from(self.lines, {
                yPercent: 110,
                opacity: 0,
                duration: 1.1,
                ease: 'expo.out',
                stagger: 0.08,
                scrollTrigger: { trigger: titleEl, start: 'top 80%' },
              });
            },
          });
        }
      }

      if (subtitle) {
        gsap.to(subtitle, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          delay: 0.15,
          scrollTrigger: { trigger: subtitle, start: 'top 85%' },
        });
      }

      // Cards: staggered reveal when the grid enters view
      if (cards.length) {
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: section.querySelector('.services__col-list') || cards[0],
            start: 'top 85%',
          },
        });
      }
    })();
  });

// === INLINE SCRIPT 7 ===
document.addEventListener('DOMContentLoaded', () => {
    function whyUsCardsAnimation() {
      const cards = gsap.utils.toArray('.why-us__card-wrap');
      const cardsContainer = document.querySelector('.why-us');
      const cardContents = gsap.utils.toArray('.partners-card-content');
      const cardBgText = gsap.utils.toArray('.why-us-card__bg-text');
      const cardImages = gsap.utils.toArray('.why-us-card__img-box');
      const totalCards = cards.length;

      // Setting the initial positions of the cards
      function setInitialPositions() {
        cards.forEach((card, index) => {
          if (index === 0) {
            gsap.set(card, { x: 0, y: 0, z: 0, scale: 1 });
          } else {
            gsap.set(card, { y: '100vh', z: 0 });
          }
        });
      }

      // Mobile version
      mm.add('(max-width: 479px)', () => {
        setInitialPositions();

        cards.forEach((card, index) => {
          if (index === 0) return;

          const cardDuration = 1;

          const cardTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: cardsContainer,
              start: () => `top+=${(index - 1) * (cardsContainer.offsetHeight / totalCards)} top`,
              end: () => `top+=${index * (cardsContainer.offsetHeight / totalCards)} top`,
              scrub: 1,
            },
          });

          // Current card - mobile values
          cardTimeline.fromTo(
            card,
            {
              y: '100vh',
              z: 15,
            },
            {
              y: 0,
              z: 0,

              duration: cardDuration,
              ease: 'power1.out',
              immediateRender: false,
            },
            0,
          );

          // // Content animation
          // cardTimeline.fromTo(
          //   cardContents[index],
          //   {
          //     y: 200,
          //   },
          //   {
          //     y: 0,
          //     duration: cardDuration,
          //     ease: 'power1.out',
          //     immediateRender: false,
          //   },
          //   0,
          // );

          // Image animation
          cardTimeline.fromTo(
            cardImages[index],
            {
              scale: 0.8,
            },
            {
              scale: 1,
              duration: cardDuration,
              ease: 'power1.out',
              immediateRender: false,
            },
            0,
          );

          // Animation of bg text
          cardTimeline.fromTo(
            cardBgText[index],
            {
              y: 150,
              opacity: 0,
            },
            {
              y: 0,
              opacity: 1,
              duration: cardDuration,
              ease: 'power1.out',
              immediateRender: false,
            },
            0,
          );

          // Previous card - mobile depth values
          if (index >= 1) {
            const prevCard = cards[index - 1];

            cardTimeline.fromTo(
              prevCard,
              {
                z: 0,
              },
              {
                z: -20,
                duration: cardDuration * 0.5,
                ease: 'power1.out',
                immediateRender: false,
              },
              cardDuration * 0.5,
            ); // Starts at 50%
          }

          // U-2 card
          if (index >= 2) {
            const prevPrevCard = cards[index - 2];

            cardTimeline.fromTo(
              prevPrevCard,
              {
                z: -20,
              },
              {
                z: -40,
                duration: cardDuration * 0.5,
                ease: 'power1.out',
                immediateRender: false,
              },
              cardDuration * 0.5,
            );
          }
        });
      });

      // Tablet/portrait version — cards already stack in normal flow here
      // (no absolute positioning), so no "flying card" effect — just a
      // simple per-card reveal as each one scrolls into view.
      mm.add('(min-width: 480px) and (orientation: portrait)', () => {
        cards.forEach((card, index) => {
          gsap.set(card, { opacity: 0, y: 60 });

          gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
            },
          });

          if (cardBgText[index]) {
            gsap.fromTo(
              cardBgText[index],
              { y: 40, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.9,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: card,
                  start: 'top 85%',
                },
              },
            );
          }

          if (cardImages[index]) {
            gsap.fromTo(
              cardImages[index],
              { scale: 0.85 },
              {
                scale: 1,
                duration: 1,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: card,
                  start: 'top 85%',
                },
              },
            );
          }
        });
      });

      // Desktop version
      mm.add('(min-width: 480px) and (orientation: landscape)', () => {
        setInitialPositions();

        cards.forEach((card, index) => {
          if (index === 0) return;

          const cardDuration = 1;

          const cardTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: cardsContainer,
              start: () => `top+=${(index - 1) * (cardsContainer.offsetHeight / totalCards)} top`,
              end: () => `top+=${index * (cardsContainer.offsetHeight / totalCards)} top`,
              scrub: 1,
            },
          });

          // Current card - desktop values
          cardTimeline.fromTo(
            card,
            {
              y: '100vh',
              z: 50,
            },
            {
              y: 0,
              z: 0,

              duration: cardDuration,
              ease: 'power1.out',
              immediateRender: false,
            },
            0,
          );

          // // Content animation
          // cardTimeline.fromTo(
          //   cardContents[index],
          //   {
          //     y: 850,
          //   },
          //   {
          //     y: 0,
          //     duration: cardDuration,
          //     ease: 'power1.out',
          //     immediateRender: false,
          //   },
          //   0,
          // );

          // Animation of bg text
          cardTimeline.fromTo(
            cardBgText[index],
            {
              y: 150,
              opacity: 0,
            },
            {
              y: 0,
              opacity: 1,
              duration: cardDuration,
              ease: 'power1.out',
              immediateRender: false,
            },
            0,
          );

          // Image animation
          cardTimeline.fromTo(
            cardImages[index],
            {
              scale: 0.8,
            },
            {
              scale: 1,
              duration: cardDuration,
              ease: 'power1.out',
              immediateRender: false,
            },
            0,
          );

          // Previous card
          if (index >= 1) {
            const prevCard = cards[index - 1];

            cardTimeline.fromTo(
              prevCard,
              {
                z: 0,
              },
              {
                z: -100,
                duration: cardDuration * 0.65,
                ease: 'power1.out',
                immediateRender: false,
              },
              cardDuration * 0.35,
            );
          }

          // U-2 card
          if (index >= 2) {
            const prevPrevCard = cards[index - 2];

            cardTimeline.fromTo(
              prevPrevCard,
              {
                z: -100,
              },
              {
                z: -200,
                duration: cardDuration * 0.65,
                ease: 'power1.out',
                immediateRender: false,
              },
              cardDuration * 0.35,
            );
          }
        });
      });
    }
    whyUsCardsAnimation();

    // === Why Us Animations (heading only — cards already handled by why-us-js) ===
    (function () {
      'use strict';

      const section = document.querySelector('[data-why-us]');
      if (!section) return;

      const caption = section.querySelector('[data-why-us="caption"]');
      const titleEl = section.querySelector('[data-why-us="title"]');
      const subtitle = section.querySelector('[data-why-us="subtitle"]');

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced) {
        gsap.set([caption, subtitle].filter(Boolean), { opacity: 1, y: 0 });
        if (titleEl) gsap.set(titleEl, { opacity: 1 });
        return;
      }

      if (caption) {
        gsap.to(caption, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: caption, start: 'top 85%' },
        });
      }

      // Title: same line-by-line mask reveal pattern as hero/intro/services
      if (titleEl) {
        gsap.set(titleEl, { opacity: 1 });
        if (window.SplitText) {
          SplitText.create(titleEl, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'split-lines',
            autoSplit: true,
            onSplit(self) {
              return gsap.from(self.lines, {
                yPercent: 110,
                opacity: 0,
                duration: 1.1,
                ease: 'expo.out',
                stagger: 0.08,
                scrollTrigger: { trigger: titleEl, start: 'top 80%' },
              });
            },
          });
        }
      }

      if (subtitle) {
        gsap.to(subtitle, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          delay: 0.15,
          scrollTrigger: { trigger: subtitle, start: 'top 85%' },
        });
      }
    })();
  });

// === INLINE SCRIPT 8 ===
document.addEventListener('DOMContentLoaded', () => {
    // === Testimonials Animations (slider itself handled by Splide, not animated here) ===
    (function () {
      'use strict';

      const section = document.querySelector('[data-testimonials]');
      if (!section) return;

      const caption = section.querySelector('[data-testimonials="caption"]');
      const titleEl = section.querySelector('[data-testimonials="title"]');
      const subtitle = section.querySelector('[data-testimonials="subtitle"]');
      const cards = gsap.utils.toArray(section.querySelectorAll('.testimonials-card'));

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced) {
        gsap.set([caption, subtitle, ...cards].filter(Boolean), { opacity: 1, y: 0 });
        if (titleEl) gsap.set(titleEl, { opacity: 1 });
        return;
      }

      if (caption) {
        gsap.to(caption, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: caption, start: 'top 85%' },
        });
      }

      // Title: same line-by-line mask reveal pattern as hero/intro/services/why-us
      if (titleEl) {
        gsap.set(titleEl, { opacity: 1 });
        if (window.SplitText) {
          SplitText.create(titleEl, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'split-lines',
            autoSplit: true,
            onSplit(self) {
              return gsap.from(self.lines, {
                yPercent: 110,
                opacity: 0,
                duration: 1.1,
                ease: 'expo.out',
                stagger: 0.08,
                scrollTrigger: { trigger: titleEl, start: 'top 80%' },
              });
            },
          });
        }
      }

      if (subtitle) {
        gsap.to(subtitle, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          delay: 0.15,
          scrollTrigger: { trigger: subtitle, start: 'top 85%' },
        });
      }

      if (cards.length) {
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: section.querySelector('.testimonials__splide') || cards[0],
            start: 'top 85%',
          },
        });
      }
    })();
  });

// === INLINE SCRIPT 9 ===
document.addEventListener('DOMContentLoaded', () => {
    // === Team Animations (slider is type:"fade" — Splide owns each slide's
    // opacity, so we animate the whole .team__splide wrapper, not .team-card) ===
    (function () {
      'use strict';

      const section = document.querySelector('[data-team]');
      if (!section) return;

      const caption = section.querySelector('[data-team="caption"]');
      const titleEl = section.querySelector('[data-team="title"]');
      const slider = section.querySelector('.team__splide');

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced) {
        gsap.set([caption, slider].filter(Boolean), { opacity: 1, y: 0 });
        if (titleEl) gsap.set(titleEl, { opacity: 1 });
        return;
      }

      if (caption) {
        gsap.to(caption, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: caption, start: 'top 85%' },
        });
      }

      // Title: same line-by-line mask reveal pattern as the rest of the site
      if (titleEl) {
        gsap.set(titleEl, { opacity: 1 });
        if (window.SplitText) {
          SplitText.create(titleEl, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'split-lines',
            autoSplit: true,
            onSplit(self) {
              return gsap.from(self.lines, {
                yPercent: 110,
                opacity: 0,
                duration: 1.1,
                ease: 'expo.out',
                stagger: 0.08,
                scrollTrigger: { trigger: titleEl, start: 'top 80%' },
              });
            },
          });
        }
      }

      if (slider) {
        gsap.to(slider, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          delay: 0.15,
          scrollTrigger: { trigger: slider, start: 'top 88%' },
        });
      }
    })();
  });

// === INLINE SCRIPT 10 ===
document.addEventListener('DOMContentLoaded', () => {
    // === CTA Animations (same pattern as Hero, triggered on scroll) ===
    (function () {
      'use strict';

      const section = document.querySelector('[data-cta]');
      if (!section) return;

      const bg = section.querySelector('[data-cta="bg"]');
      const titleEl = section.querySelector('[data-cta="title"]');
      const text = section.querySelector('[data-cta="text"]');
      const btn = section.querySelector('[data-cta="btn"]');

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced) {
        gsap.set([bg, text, btn].filter(Boolean), { y: 0, scale: 1 });
        if (titleEl) gsap.set(titleEl, { opacity: 1 });
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top 70%' },
      });

      if (bg) {
        tl.to(bg, { scale: 1, duration: 1.8, ease: 'power2.out' }, 0);
      }

      if (titleEl) {
        tl.set(titleEl, { opacity: 1 }, 0);
        if (window.SplitText) {
          SplitText.create(titleEl, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'split-lines',
            autoSplit: true,
            onSplit(self) {
              return gsap.from(self.lines, {
                yPercent: 110,
                opacity: 0,
                duration: 1.1,
                ease: 'expo.out',
                stagger: 0.08,
                scrollTrigger: { trigger: section, start: 'top 70%' },
              });
            },
          });
        }
      }

      if (text) tl.to(text, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }, 0.5);

      if (btn) {
        tl.to(btn, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }, 0.6);
        const btnParts = btn.querySelectorAll(':scope > div');
        if (btnParts.length) {
          tl.from(btnParts, { yPercent: 60, opacity: 0, duration: 0.5, stagger: 0.05 }, 0.7);
        }
      }
    })();
  });

// === INLINE SCRIPT 11 ===
gsap.registerPlugin(ScrollTrigger,SplitText);

// === INLINE SCRIPT 12 ===
let mm = gsap.matchMedia();

  // Recalculate all ScrollTriggers on resize
  // let resizeTimeout;
  // window.addEventListener('resize', () => {
  //   clearTimeout(resizeTimeout);
  //   resizeTimeout = setTimeout(() => {
  //     ScrollTrigger.refresh(true);
  //   }, 300);
  // });
  // END Recalculate all ScrollTriggers on resize

  document.addEventListener("DOMContentLoaded", () => {
    // Mirror click for close button
    $("[data-close-menu]").click(function() {
      $(".w-nav-button").click();
    });
    // END Mirror click for close button

    // Mirror click for overlay
    $(".nav__menu-wrap").click(function(e) {
      if (e.target === this) {
        const $navbar = document.querySelector('.w-nav-menu');
        if ($navbar?.hasAttribute('data-nav-menu-open')) {
          $(".w-nav-button").click();
        }
      }
    });
    // END Mirror click for overlay

    // handleHeaderScroll
    function handleHeaderScroll() {
      const header = document.querySelector('.header');
      if (!header) return;

      const toggleClass = () => {
        header.classList.toggle('is-scrolled', window.scrollY > 1);
      };

      toggleClass();
      window.addEventListener('scroll', toggleClass, { passive: true });
    }
    handleHeaderScroll();
    // END handleHeaderScroll

    // Get current year
    document.querySelectorAll('[data-footer-year]').forEach(div => {
      div.textContent = new Date().getFullYear();
    });
    // END Get current year
  });