(function () {
  'use strict';

  function getClinicFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('clinic');
    if (!q) return null;

    const list = window.MARK85_TOP10 || [];
    if (/^\d+$/.test(q)) {
      const idx = parseInt(q, 10) - 1;
      return list[idx] || null;
    }
    const lower = q.toLowerCase();
    return (
      list.find(
        (c) =>
          (c.title && c.title.toLowerCase().includes(lower)) ||
          (c.instagram && c.instagram.toLowerCase() === lower)
      ) || null
    );
  }

  function cleanClinicName(title) {
    if (!title) return 'Clinic';
    return title.split(' - ')[0].trim();
  }

  function formatWordmark(name) {
    const short = cleanClinicName(name)
      .replace(/Aesthetic Clinic|Dental Implant Centre|Dental Care|Skin Clinic|Dental & Implant Clinic|Dental World|Dentistry|Dental Clinic/gi, '')
      .trim();
    const base = short.length >= 3 ? short : cleanClinicName(name);
    return base.toUpperCase().slice(0, 22);
  }

  function slugify(str) {
    return (str || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function splitServiceTitle(name) {
    const parts = (name || '').split('/')[0].trim().split(/\s+/);
    if (parts.length <= 1) return `<h3>${parts[0] || ''}</h3>`;
    const last = parts.pop();
    return `<h3>${parts.join(' ')} <strong>${last}</strong></h3>`;
  }

  function applyClinic(clinic) {
    if (!clinic) return;

    const fullName = cleanClinicName(clinic.title);
    const wordmark = formatWordmark(clinic.title);
    const isDental = (clinic.clinic_type || '').toLowerCase().includes('dental');
    const city = clinic.city || 'Hyderabad';
    const rating = clinic.rating ? `${clinic.rating}★` : '4.9★';
    const reviews = clinic.reviews ? `${clinic.reviews}+` : '200+';
    const phone = clinic.phone || '+91 90000 00000';
    const email = clinic.primary_email || (clinic.emails && clinic.emails[0]) || 'hello@clinic.com';
    const igHandle = clinic.instagram ? `@${clinic.instagram.replace(/^@/, '')}` : '';
    const igUrl = clinic.instagram ? `https://instagram.com/${clinic.instagram.replace(/^@/, '')}` : '#';
    const waDigits = phone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${waDigits}?text=${encodeURIComponent(`Hi ${fullName}, I'd like to book a consultation.`)}`;

    // 1. Document Title & Meta
    document.title = `${fullName} — ${clinic.clinic_type || 'Clinic'} in ${city}`;

    // 2. Header & Footer Logo Wordmark (preserves .logo__img dimensions & color)
    document.querySelectorAll('.logo__img, .footer__logo .w-embed').forEach((el) => {
      el.innerHTML = `<span style="font-family: 'Neuehaasgroteskdisplaypro 65 English', 'Neuemontreal English', sans-serif; font-weight: 500; font-size: 1.15rem; letter-spacing: 0.14em; line-height: 1; white-space: nowrap; display: inline-block;">${wordmark}</span>`;
    });

    // 3. Hero Section
    const heroTitle = document.querySelector('[data-hero="title"]');
    if (heroTitle) {
      heroTitle.innerHTML = isDental
        ? `Your Smile, <br/>Our Commitment <span class="text-display-serif">to Excellence</span>`
        : `Your Radiance, <br/>Our Commitment <span class="text-display-serif">to Excellence</span>`;
    }
    const heroText = document.querySelector('[data-hero="cta-text"]');
    if (heroText) {
      heroText.textContent = isDental
        ? `Precision dental & implant care at ${fullName} in ${city}. Rated ${rating} across ${reviews} patient reviews.`
        : `Clinical dermatology, skin & aesthetic care at ${fullName} in ${city}. Rated ${rating} across ${reviews} patient reviews.`;
    }

    // 4. Intro / About Section
    const aboutTitle = document.querySelector('[data-about="title"]');
    if (aboutTitle) {
      const leadDoc = clinic.doctors && clinic.doctors[0] ? clinic.doctors[0] : 'our specialist team';
      aboutTitle.innerHTML = isDental
        ? `<span class="intro__title-span">At ${fullName}, we are dedicated to</span> providing exceptional <span class="h2-serif">dental care in a warm,</span> welcoming ${city} space. Led by ${leadDoc}, we use <span class="h2-serif">advanced technology for lasting smiles.</span>`
        : `<span class="intro__title-span">At ${fullName}, we are dedicated to</span> providing exceptional <span class="h2-serif">skin &amp; aesthetic care in a warm,</span> welcoming ${city} space. Led by ${leadDoc}, we combine <span class="h2-serif">clinical science with personalized treatments.</span>`;
    }
    const aboutText = document.querySelector('[data-about="text"]');
    if (aboutText) {
      const claim = (clinic.claims && clinic.claims[1]) || (clinic.claims && clinic.claims[0]);
      if (claim && claim.length > 25 && claim.length < 220) {
        aboutText.textContent = claim;
      }
    }

    // 5. Services Section (fill non-empty cards with clinic's real services)
    const servicesTitle = document.querySelector('[data-services="title"]');
    if (servicesTitle) {
      servicesTitle.innerHTML = isDental
        ? `Transforming Smiles with <span class="h1-serif">Modern Treatments</span>`
        : `Elevating Confidence with <span class="h1-serif">Modern Treatments</span>`;
    }
    const serviceItems = Array.from(document.querySelectorAll('.services__col-item'));
    const nonEmptyItems = serviceItems.filter((item) => {
      const card = item.querySelector('[data-service-card]');
      return card && card.getAttribute('data-service-card') !== 'empty';
    });

    const clinicServices = clinic.services && clinic.services.length ? clinic.services : [];
    if (clinicServices.length) {
      nonEmptyItems.forEach((item, idx) => {
        const svcName = clinicServices[idx % clinicServices.length];
        const slug = slugify(svcName);
        const numEl = item.querySelector('.service-card__number');
        const titleEl = item.querySelector('.service-card__title');
        const descrEl = item.querySelector('.service-card__descr p');
        const triggerBtn = item.querySelector('[data-book-trigger]');
        const linkEl = item.querySelector('.service-link');

        if (numEl) numEl.textContent = `(${String(idx + 1).padStart(2, '0')})`;
        if (titleEl) titleEl.innerHTML = splitServiceTitle(svcName);
        if (descrEl) {
          descrEl.textContent = `Personalized ${svcName.toLowerCase()} protocols at ${fullName}, tailored for comfort, safety, and natural results.`;
        }
        if (triggerBtn) triggerBtn.setAttribute('data-book-treatment', slug);
        if (linkEl) linkEl.setAttribute('href', '#services');
      });
    }

    // 6. Testimonials Subtitle
    const testSubtitle = document.querySelector('[data-testimonials="subtitle"]');
    if (testSubtitle) {
      testSubtitle.textContent = `${rating} rated across ${reviews} verified patient reviews in ${city}. Comfort, trust, and results that speak for themselves.`;
    }

    // 7. Team Section (populate clinic.doctors into .team__slide)
    const doctors = clinic.doctors && clinic.doctors.length ? clinic.doctors : ['Dr. Specialist'];
    const teamSlides = Array.from(document.querySelectorAll('.team__slide'));
    teamSlides.forEach((slide, idx) => {
      if (idx >= doctors.length) {
        slide.remove();
        return;
      }
      const rawDoc = doctors[idx].trim();
      const docWithoutDr = rawDoc.replace(/^Dr\.?\s*/i, '');
      const nameEl = slide.querySelector('[data-team="author-name"]');
      const jobEl = slide.querySelector('[data-team="author-job"]');
      const specRow = slide.querySelector('.team-card__author-spec__row');
      if (nameEl) {
        nameEl.innerHTML = `<span class="text-p1-serif">Dr.</span> <br/>${docWithoutDr}`;
      }
      if (jobEl) {
        jobEl.textContent = isDental ? 'Lead Dental & Implant Specialist' : 'Lead Dermatologist & Aesthetic Specialist';
      }
      if (specRow && clinicServices.length) {
        specRow.innerHTML = clinicServices
          .slice(0, 3)
          .map((s) => `<div class="text-b2--medium">${s.split('/')[0].trim()}</div>`)
          .join('');
      }
    });

    // 8. CTA Section
    const ctaText = document.querySelector('[data-cta="text"]');
    if (ctaText) {
      ctaText.textContent = `Visit ${fullName} in ${city} or book your assessment online in under 60 seconds.`;
    }

    // 9. Footer Details (address, phone, email, Instagram, copyright)
    const footerLinks = document.querySelectorAll('.footer__link');
    footerLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const textDiv = link.querySelector('[data-stagger-link-text]') || link;
      if (href.startsWith('tel:')) {
        link.setAttribute('href', `tel:${phone.replace(/\s+/g, '')}`);
        textDiv.textContent = phone;
      } else if (href.startsWith('mailto:')) {
        link.setAttribute('href', `mailto:${email}`);
        textDiv.textContent = email;
      } else if (href.includes('instagram.com') && igHandle) {
        link.setAttribute('href', igUrl);
        textDiv.textContent = igHandle;
      }
    });

    document.querySelectorAll('.footer__copyright, .footer__copy-text').forEach((el) => {
      if (el.textContent.includes('Nova Dental')) {
        el.textContent = el.textContent.replace(/Nova Dental/g, fullName);
      }
    });

    // 10. Booking Modal: populate treatments & doctors from clinic data
    const modal = document.querySelector('[data-booking-modal]');
    if (modal) {
      const treatWrap = modal.querySelector('.booking-treatments__list');
      if (treatWrap && clinicServices.length) {
        const firstCard = treatWrap.querySelector('.booking-treatments__item');
        if (firstCard) {
          const template = firstCard.cloneNode(true);
          treatWrap.innerHTML = '';
          clinicServices.slice(0, 6).forEach((svc) => {
            const card = template.cloneNode(true);
            const input = card.querySelector('input[name="treatment"]');
            const label = card.querySelector('.booking-treatment-card__title, .text-b2--medium');
            const slug = slugify(svc);
            if (input) {
              input.value = slug;
              input.checked = false;
            }
            if (label) label.textContent = svc.split('/')[0].trim();
            treatWrap.appendChild(card);
          });
        }
      }

      const docWrap = modal.querySelector('.booking-doctors__list');
      if (docWrap && doctors.length) {
        const firstDoc = docWrap.querySelector('.booking-doctors__item');
        if (firstDoc) {
          const template = firstDoc.cloneNode(true);
          docWrap.innerHTML = '';
          doctors.forEach((doc) => {
            const card = template.cloneNode(true);
            const input = card.querySelector('input[name="doctor"]');
            const nameEl = card.querySelector('.booking-doctor-card__name, .text-b2--medium');
            const roleEl = card.querySelector('.booking-doctor-card__job, .text-caption');
            const slug = slugify(doc);
            if (input) {
              input.value = slug;
              input.checked = false;
            }
            if (nameEl) nameEl.textContent = doc;
            if (roleEl) roleEl.textContent = isDental ? 'Dental Specialist' : 'Aesthetic Specialist';
            docWrap.appendChild(card);
          });
        }
      }

      // Wire WhatsApp direct handoff on Step 3
      const step3Btn = modal.querySelector('[data-step="3"] a.btn, [data-step="3"] .btn');
      if (step3Btn && step3Btn.tagName === 'A') {
        step3Btn.setAttribute('href', waUrl);
        step3Btn.setAttribute('target', '_blank');
      }
    }

    // 11. Inject real scraped images from original site into Photo Picker
    const picGrid = document.querySelector('[data-pic-grid]');
    if (picGrid && clinic.images && clinic.images.length) {
      clinic.images.slice(0, 3).forEach((imgUrl, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'm85-pic-thumb';
        btn.setAttribute('data-pic-src', imgUrl);
        btn.innerHTML = `<img src="${imgUrl}" alt="Original site photo ${idx + 1}" onerror="this.closest('button').remove()"/><span>Original #${idx + 1}</span>`;
        picGrid.prepend(btn);
      });
    }
  }

  function normalizeToClinicConfig(raw) {
    if (!raw) return null;
    if (raw.clinicName && raw.whatsappNumber) return raw;
    const cleanName = cleanClinicName(raw.title);
    const leadDoc = (raw.doctors && raw.doctors[0]) || 'Specialist';
    return {
      ...raw,
      clinicName: cleanName,
      doctorName: leadDoc,
      whatsappNumber: raw.phone || '+919000000000',
      location: raw.city || 'Hyderabad',
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const raw = window.CLINIC_CONFIG || window.MARK85_CLINIC || getClinicFromQuery();
    if (raw) {
      const normalized = normalizeToClinicConfig(raw);
      window.CLINIC_CONFIG = normalized;
      window.MARK85_CLINIC = normalized;
      applyClinic(normalized);
    }
  });
})();
