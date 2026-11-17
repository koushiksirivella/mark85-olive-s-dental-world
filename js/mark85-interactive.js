(function () {
  'use strict';

  const COMPARE_PRESETS = {
    veneers: {
      label: 'Porcelain Veneers',
      title: 'Ultra-Thin Porcelain Veneers (2 Visits)',
      desc: 'Drag the slider left or right to inspect shade symmetry, enamel contour & natural translucency.',
      time: '⏱ 2 Visits (5–7 Days)',
      comfort: '✦ Minimal-Prep Enamel Safe',
      img: 'https://cdn.prod.website-files.com/6a42c6bb158437a90659a312/6a4c27305b12fcf5c1a2cf5f_testimonials-img-2.avif',
    },
    implants: {
      label: 'Dental Implants',
      title: 'Guided Titanium & Zirconia Implants',
      desc: '3D CBCT-planned single & full-arch tooth replacement engineered for natural bite strength.',
      time: '⏱ 45–60 Min Guided Placement',
      comfort: '✦ Keyhole Micro-Surgery',
      img: 'https://cdn.prod.website-files.com/6a48115c18373703513bcb43/6a481673546b582959317b6d_implantation.avif',
    },
    aligners: {
      label: 'Clear Aligners',
      title: 'Invisible Clear Aligners & Bite Design',
      desc: 'Digital intraoral scanning replaces messy putty impressions for predictable tooth movement.',
      time: '⏱ 4–9 Months Avg.',
      comfort: '✦ Zero Brackets · Removable',
      img: 'https://cdn.prod.website-files.com/6a48115c18373703513bcb43/6a48169f0631537f48e2bdba_orthodontic%20treatment.avif',
    },
    rootcanal: {
      label: 'Root Canal',
      title: 'Microscope Single-Sitting Root Canal',
      desc: 'Rotary endodontics with apex-locator precision eliminates pain and preserves natural tooth structure.',
      time: '⏱ Single 45-Min Sitting',
      comfort: '✦ Computerized Gentle Anesthesia',
      img: 'https://cdn.prod.website-files.com/6a48115c18373703513bcb43/6a48175c7c1a18c185384a5c_surgical%20dentistry.avif',
    },
    whitening: {
      label: 'Laser Whitening',
      title: 'Beyond® Cold-Light Laser Whitening',
      desc: 'Enamel-safe shade elevation by up to 4–6 tones in a single comfortable 45-minute session.',
      time: '⏱ 45 Minutes In-Clinic',
      comfort: '✦ Zero Sensitivity Desensitizer',
      img: 'https://cdn.prod.website-files.com/6a48115c18373703513bcb43/6a4817387ce8bb849db0dd76_teeth%20whitening.avif',
    },
  };

  function getStudioStateKey() {
    const params = new URLSearchParams(window.location.search);
    const cfg = window.CLINIC_CONFIG || window.MARK85_CLINIC;
    const clinicParam = params.get('clinic') || (cfg && (cfg.clinicName || cfg.title)) || 'nova-default';
    return 'm85_studio_' + clinicParam.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  }

  function loadStudioState() {
    try {
      const raw = localStorage.getItem(getStudioStateKey());
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveStudioState(state) {
    try {
      localStorage.setItem(getStudioStateKey(), JSON.stringify(state));
    } catch {
      // ignore storage quota errors
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const clinic = window.CLINIC_CONFIG || window.MARK85_CLINIC || null;
    const saved = loadStudioState();

    const defaultClinicName = clinic ? (clinic.clinicName || (clinic.title || '').split(' - ')[0].trim()) : 'Nova Dental';
    const defaultDoctor = clinic ? (clinic.doctorName || (clinic.doctors && clinic.doctors[0]) || 'Specialist') : 'Emily Peterson';
    const cleanDocName = defaultDoctor.replace(/^Dr\.?\s*/i, '').trim();

    const state = {
      theme: saved.theme || 'aurora',
      clinicName: saved.clinicName || defaultClinicName,
      doctorName: cleanDocName,
      waNumber: saved.waNumber || (clinic && (clinic.whatsappNumber || clinic.phone)) || '+919575796767',
      waGreeting:
        saved.waGreeting ||
        `Hi! Chat directly with ${defaultClinicName} on WhatsApp for bookings, treatment costs, or timings.`,
      heroUrl: saved.heroUrl || '',
      aboutUrl: saved.aboutUrl || '',
      doctorUrl: saved.doctorUrl || '',
      galleryUrl: saved.galleryUrl || '',
    };

    document.documentElement.setAttribute('data-m85-theme', state.theme);

    function buildWhatsAppUrl(treatmentOrMsg) {
      const digits = (state.waNumber || '').replace(/[^0-9]/g, '');
      const text = treatmentOrMsg || `Hi Dr. ${state.doctorName}, I saw ${state.clinicName}'s page and want to book a consultation.`;
      return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
    }

    function swapHeroImage(url) {
      if (!url) return;
      const bg = document.querySelector('[data-hero="bg"]');
      if (!bg) return;
      if (window.gsap) {
        gsap.to(bg, {
          opacity: 0.35,
          duration: 0.22,
          onComplete: () => {
            bg.style.backgroundImage = `url("${url}")`;
            gsap.to(bg, { opacity: 1, duration: 0.45, ease: 'power2.out' });
          },
        });
      } else {
        bg.style.backgroundImage = `url("${url}")`;
      }
    }

    function swapImgEl(selector, url) {
      if (!url) return;
      const img = document.querySelector(selector);
      if (!img) return;
      img.removeAttribute('srcset');
      img.src = url;
    }

    if (state.heroUrl) swapHeroImage(state.heroUrl);
    if (state.aboutUrl) swapImgEl('[data-about="img"] img', state.aboutUrl);
    if (state.doctorUrl) swapImgEl('.team-card__img-wrap img', state.doctorUrl);
    if (state.galleryUrl) swapImgEl('.testimonials-card__big-img', state.galleryUrl);

    // 1. GSAP Scroll Progress, Trust Counters, Journey Timeline & Specular Cards
    if (window.gsap) {
      const progressBar = document.querySelector('[data-m85-progress]');
      if (progressBar && window.ScrollTrigger) {
        gsap.to(progressBar, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: document.documentElement,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.25,
          },
        });
      }

      const dockChips = document.querySelectorAll('.m85-dock-chip');
      if (dockChips.length) {
        gsap.from(dockChips, {
          y: 18,
          opacity: 0,
          duration: 0.7,
          stagger: 0.08,
          delay: 1.35,
          ease: 'power3.out',
        });
      }

      // Animated Trust Counters
      if (window.ScrollTrigger) {
        document.querySelectorAll('[data-count-target]').forEach((el) => {
          const target = parseFloat(el.dataset.countTarget);
          const suffix = el.dataset.countSuffix || '';
          const isDecimal = String(el.dataset.countTarget).includes('.');
          const obj = { val: 0 };
          gsap.to(obj, {
            val: target,
            duration: 1.5,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
            onUpdate: () => {
              const formatted = isDecimal ? obj.val.toFixed(1) : Math.round(obj.val).toLocaleString();
              el.textContent = `${formatted}${suffix}`;
            },
          });
        });

        // Patient Journey Timeline Stagger
        const journeySteps = document.querySelectorAll('.m85-journey-step');
        if (journeySteps.length) {
          gsap.from(journeySteps, {
            y: 26,
            opacity: 0,
            duration: 0.75,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: '[data-journey-timeline]', start: 'top 88%', once: true },
          });
        }
      }

      // Specular cursor light on Service cards
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.querySelectorAll('.service-card').forEach((card) => {
          card.addEventListener('pointermove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mx', x.toFixed(1) + '%');
            card.style.setProperty('--my', y.toFixed(1) + '%');
          });
        });
      }
    }

    // 2. Journey Step Active Toggle
    document.querySelectorAll('.m85-journey-step').forEach((step) => {
      step.addEventListener('click', () => {
        document.querySelectorAll('.m85-journey-step').forEach((s) => s.classList.remove('is-active'));
        step.classList.add('is-active');
      });
    });

    // 3. Scroll-Triggered Section Storyteller Pill
    const guideBadge = document.querySelector('[data-guide-badge]');
    const guideText = document.querySelector('[data-guide-text]');
    const sectionMap = [
      { el: document.querySelector('[data-hero]'), badge: 'Welcome', text: 'Hero — Explore treatments, before/after & WhatsApp booking' },
      { el: document.querySelector('[data-about]'), badge: 'About', text: 'Clinic Story — Specialist care & precision technology' },
      { el: document.querySelector('[data-services]'), badge: 'Services', text: 'Hover or tap any treatment card to inspect & book' },
      { el: document.querySelector('#transformations'), badge: 'Compare', text: 'Drag Before/After slider, inspect treatments & pick slot photos' },
      { el: document.querySelector('[data-why-us]'), badge: 'Why Us', text: 'Scroll-scrubbed 3D depth pillars of clinical excellence' },
      { el: document.querySelector('[data-testimonials]'), badge: 'Reviews', text: 'Verified patient transformations & stories' },
      { el: document.querySelector('#assessment'), badge: '60s Quiz', text: 'Tap your treatment goal to get a personalized WhatsApp plan' },
      { el: document.querySelector('[data-team]'), badge: 'Doctors', text: 'Meet the specialist team leading your care' },
      { el: document.querySelector('[data-cta]'), badge: 'Book', text: 'Reserve your slot or message the WhatsApp desk directly' },
    ].filter((s) => s.el);

    if (guideBadge && guideText && sectionMap.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const hit = sectionMap.find((s) => s.el === entry.target);
            if (hit) {
              guideBadge.textContent = hit.badge;
              guideText.textContent = hit.text;
            }
          });
        },
        { rootMargin: '-35% 0px -45% 0px', threshold: 0.01 }
      );
      sectionMap.forEach((s) => io.observe(s.el));
    }

    // 4. Before/After Drag Compare Slider + Treatment Breakdown + Dynamic WhatsApp CTA
    const slider = document.querySelector('[data-compare-slider]');
    if (slider) {
      const beforeWrap = slider.querySelector('[data-compare-before-wrap]');
      const divider = slider.querySelector('[data-compare-divider]');
      const handle = slider.querySelector('[data-compare-handle]');
      const beforeImg = slider.querySelector('[data-compare-before]');
      const afterImg = slider.querySelector('[data-compare-after]');
      const titleEl = slider.querySelector('[data-compare-title]');
      const descEl = slider.querySelector('[data-compare-desc]');
      const timeEl = slider.querySelector('[data-compare-time]');
      const comfortEl = slider.querySelector('[data-compare-comfort]');
      const waCtaEl = slider.querySelector('[data-compare-wa-cta]');
      let dragging = false;

      const updateCompareWa = (treatmentLabel) => {
        if (!waCtaEl) return;
        const msg = `Hi Dr. ${state.doctorName}, I saw your page and want to book a consultation for ${treatmentLabel}.`;
        waCtaEl.href = buildWhatsAppUrl(msg);
        waCtaEl.textContent = `WhatsApp for ${treatmentLabel} →`;
      };
      updateCompareWa(COMPARE_PRESETS.veneers.label);

      const setPercent = (pct) => {
        const clamped = Math.max(6, Math.min(94, pct));
        if (beforeWrap) beforeWrap.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
        if (divider) divider.style.left = `${clamped}%`;
        if (handle) handle.style.left = `${clamped}%`;
      };

      const updateFromClientX = (clientX) => {
        const rect = slider.getBoundingClientRect();
        const pct = ((clientX - rect.left) / rect.width) * 100;
        setPercent(pct);
      };

      slider.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button, a')) return;
        dragging = true;
        slider.setPointerCapture(e.pointerId);
        updateFromClientX(e.clientX);
      });
      slider.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        updateFromClientX(e.clientX);
      });
      slider.addEventListener('pointerup', () => { dragging = false; });
      slider.addEventListener('pointercancel', () => { dragging = false; });

      document.querySelectorAll('[data-compare-preset]').forEach((tab) => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('[data-compare-preset]').forEach((t) => t.classList.remove('is-active'));
          tab.classList.add('is-active');
          const p = COMPARE_PRESETS[tab.dataset.comparePreset];
          if (!p) return;
          if (titleEl) titleEl.textContent = p.title;
          if (descEl) descEl.textContent = p.desc;
          if (timeEl) timeEl.textContent = p.time;
          if (comfortEl) comfortEl.textContent = p.comfort;
          if (beforeImg) beforeImg.src = p.img;
          if (afterImg) afterImg.src = p.img;
          updateCompareWa(p.label);
          setPercent(50);
        });
      });
    }

    // 5. 4-Slot Interactive Photo Picker & Upload
    let picTarget = 'hero';
    document.querySelectorAll('[data-pic-target]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-pic-target]').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        picTarget = btn.dataset.picTarget;
      });
    });

    function applyPickedPhoto(src) {
      if (picTarget === 'hero') {
        state.heroUrl = src;
        swapHeroImage(src);
      } else if (picTarget === 'about') {
        state.aboutUrl = src;
        swapImgEl('[data-about="img"] img', src);
      } else if (picTarget === 'doctor') {
        state.doctorUrl = src;
        swapImgEl('.team-card__img-wrap img', src);
      } else if (picTarget === 'gallery') {
        state.galleryUrl = src;
        swapImgEl('.testimonials-card__big-img', src);
      }
      saveStudioState(state);
    }

    document.querySelectorAll('[data-pic-src]').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        document.querySelectorAll('[data-pic-src]').forEach((t) => t.classList.remove('is-selected'));
        thumb.classList.add('is-selected');
        applyPickedPhoto(thumb.dataset.picSrc);
      });
    });

    const uploadInput = document.querySelector('[data-pic-upload]');
    if (uploadInput) {
      uploadInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target && typeof ev.target.result === 'string') {
            applyPickedPhoto(ev.target.result);
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // 6. Interactive 60-Second Patient Assessment
    const assessRoot = document.querySelector('[data-assess-root]');
    if (assessRoot) {
      const step1 = assessRoot.querySelector('[data-assess-step="1"]');
      const step2 = assessRoot.querySelector('[data-assess-step="2"]');
      const step3 = assessRoot.querySelector('[data-assess-step="3"]');
      const bar = assessRoot.querySelector('[data-assess-bar]');
      const label = assessRoot.querySelector('[data-assess-step-label]');
      const goalsWrap = assessRoot.querySelector('[data-assess-goals]');
      const resTitle = assessRoot.querySelector('[data-assess-result-title]');
      const resCopy = assessRoot.querySelector('[data-assess-result-copy]');
      const waSendBtn = assessRoot.querySelector('[data-assess-wa-send]');

      if (clinic && clinic.services && clinic.services.length && goalsWrap) {
        const topServices = clinic.services.slice(0, 4);
        goalsWrap.innerHTML = topServices
          .map(
            (s) =>
              `<button type="button" class="m85-option-btn" data-assess-val="${s}"><strong>${s.split('/')[0].trim()}</strong><small>Personalized ${state.clinicName} assessment</small></button>`
          )
          .join('');
      }

      let chosenGoal = '';
      let chosenTime = '';

      function goAssessStep(num) {
        [step1, step2, step3].forEach((el, idx) => {
          if (el) el.style.display = idx + 1 === num ? 'block' : 'none';
        });
        if (bar) bar.style.width = num === 1 ? '33%' : num === 2 ? '66%' : '100%';
        if (label) {
          label.textContent =
            num === 1
              ? 'Step 1 of 3 · Select Primary Goal'
              : num === 2
              ? 'Step 2 of 3 · Choose Timeline & Slot'
              : 'Step 3 of 3 · Your Plan Is Ready';
        }
      }

      assessRoot.addEventListener('click', (e) => {
        const btn = e.target.closest('.m85-option-btn');
        if (btn) {
          if (step1 && step1.contains(btn)) {
            chosenGoal = btn.dataset.assessVal || btn.innerText.trim();
            goAssessStep(2);
          } else if (step2 && step2.contains(btn)) {
            chosenTime = btn.dataset.assessVal || btn.innerText.trim();
            if (resTitle) resTitle.textContent = `${chosenGoal} · ${chosenTime}`;
            if (resCopy) {
              resCopy.textContent = `Your ${state.clinicName} specialist roadmap for ${chosenGoal} (${chosenTime}) is ready. Tap below to send directly to Dr. ${state.doctorName}'s WhatsApp desk.`;
            }
            if (waSendBtn) {
              const msg = `Hi Dr. ${state.doctorName}, I saw your page and completed the 60s assessment for ${chosenGoal} (${chosenTime}). I'd like to book a consultation at ${state.clinicName}.`;
              waSendBtn.href = buildWhatsAppUrl(msg);
            }
            goAssessStep(3);
          }
          return;
        }
        const backBtn = e.target.closest('[data-assess-back]');
        if (backBtn) {
          goAssessStep(parseInt(backBtn.dataset.assessBack, 10) || 1);
        }
      });
    }

    // 7. Customizable WhatsApp Concierge Widget
    const waCard = document.querySelector('[data-wa-card]');
    const waClinicLabel = document.querySelector('[data-wa-clinic-name]');
    const waGreetingEl = document.querySelector('[data-wa-greeting]');
    const waInput = document.querySelector('[data-wa-input]');
    const waSend = document.querySelector('[data-wa-send]');

    function syncWhatsAppUI() {
      if (waClinicLabel) waClinicLabel.textContent = `${state.clinicName} Concierge`;
      if (waGreetingEl) waGreetingEl.textContent = state.waGreeting;
    }
    syncWhatsAppUI();

    document.querySelectorAll('[data-wa-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!waCard) return;
        const willOpen = !waCard.classList.contains('is-open');
        waCard.classList.toggle('is-open', willOpen);
        if (willOpen && window.gsap) {
          gsap.fromTo(waCard, { y: 16, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'power3.out' });
        }
      });
    });

    document.querySelectorAll('[data-wa-quick]').forEach((chip) => {
      chip.addEventListener('click', () => {
        window.open(buildWhatsAppUrl(`${chip.dataset.waQuick} (${state.clinicName})`), '_blank', 'noopener');
      });
    });

    if (waSend) {
      waSend.addEventListener('click', () => {
        const custom = waInput && waInput.value.trim() ? waInput.value.trim() : '';
        window.open(buildWhatsAppUrl(custom), '_blank', 'noopener');
      });
    }

    // 8. Mark 85 Live Studio Customizer Drawer
    const drawer = document.querySelector('[data-studio-drawer]');
    const nameInput = document.querySelector('[data-studio-field="name"]');
    const waField = document.querySelector('[data-studio-field="wa"]');
    const greetField = document.querySelector('[data-studio-field="greeting"]');
    const heroUrlField = document.querySelector('[data-studio-field="heroUrl"]');

    if (nameInput) nameInput.value = state.clinicName;
    if (waField) waField.value = state.waNumber;
    if (greetField) greetField.value = state.waGreeting;
    if (heroUrlField) heroUrlField.value = state.heroUrl;

    document.querySelectorAll('[data-set-theme]').forEach((pill) => {
      pill.classList.toggle('is-active', pill.dataset.setTheme === state.theme);
      pill.addEventListener('click', () => {
        state.theme = pill.dataset.setTheme;
        document.documentElement.setAttribute('data-m85-theme', state.theme);
        document.querySelectorAll('[data-set-theme]').forEach((p) => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        saveStudioState(state);
      });
    });

    document.querySelectorAll('[data-open-studio]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (drawer) drawer.classList.add('is-open');
      });
    });
    document.querySelectorAll('[data-close-studio]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (drawer) drawer.classList.remove('is-open');
      });
    });

    const saveBtn = document.querySelector('[data-studio-save]');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (nameInput && nameInput.value.trim()) state.clinicName = nameInput.value.trim();
        if (waField && waField.value.trim()) state.waNumber = waField.value.trim();
        if (greetField && greetField.value.trim()) state.waGreeting = greetField.value.trim();
        if (heroUrlField && heroUrlField.value.trim()) {
          state.heroUrl = heroUrlField.value.trim();
          swapHeroImage(state.heroUrl);
        }
        syncWhatsAppUI();
        saveStudioState(state);
        saveBtn.textContent = '✓ Applied & Saved';
        setTimeout(() => { saveBtn.textContent = 'Save & Apply'; }, 1600);
      });
    }

    const exportBtn = document.querySelector('[data-studio-export]');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'dental-clinic-config.json';
        a.click();
      });
    }
  });
})();
