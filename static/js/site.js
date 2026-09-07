document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const slides = [...carousel.querySelectorAll('.carousel-slide')]
    const dots = [...carousel.querySelectorAll('.carousel-dots button')]
    const previous = carousel.querySelector('.carousel-prev')
    const next = carousel.querySelector('.carousel-next')
    let active = 0
    let timer

    const show = (index) => {
      active = (index + slides.length) % slides.length
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === active))
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === active)
        dot.setAttribute('aria-current', i === active ? 'true' : 'false')
      })
    }

    const stop = () => window.clearInterval(timer)
    const play = () => {
      stop()
      if (!reduceMotion) timer = window.setInterval(() => show(active + 1), 4800)
    }

    previous?.addEventListener('click', () => { show(active - 1); play() })
    next?.addEventListener('click', () => { show(active + 1); play() })
    dots.forEach((dot, index) => dot.addEventListener('click', () => { show(index); play() }))
    carousel.addEventListener('mouseenter', stop)
    carousel.addEventListener('mouseleave', play)
    carousel.addEventListener('focusin', stop)
    carousel.addEventListener('focusout', play)

    if (!reduceMotion) {
      carousel.addEventListener('pointermove', (event) => {
        const rect = carousel.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width - 0.5
        const y = (event.clientY - rect.top) / rect.height - 0.5
        carousel.style.transform = `perspective(1200px) rotateY(${x * 7 - 4}deg) rotateX(${-y * 5 + 1}deg) translateY(-2px)`
      })
      carousel.addEventListener('pointerleave', () => {
        carousel.style.transform = ''
        play()
      })
    }

    show(0)
    play()
  })

  if (!reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    const glow = document.createElement('div')
    glow.className = 'cursor-glow'
    document.body.appendChild(glow)
    window.addEventListener('pointermove', (event) => {
      glow.style.left = `${event.clientX}px`
      glow.style.top = `${event.clientY}px`
    }, { passive: true })
  }

  document.querySelectorAll('.story-card').forEach((card) => {
    if (!reduceMotion && window.matchMedia('(pointer:fine)').matches) {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect()
        const px = (event.clientX - rect.left) / rect.width
        const py = (event.clientY - rect.top) / rect.height
        const rx = (0.5 - py) * 5
        const ry = (px - 0.5) * 7
        card.style.setProperty('--mx', `${px * 100}%`)
        card.style.setProperty('--my', `${py * 100}%`)
        card.style.transform = `translateY(-7px) rotateX(${rx}deg) rotateY(${ry}deg)`
      })
      card.addEventListener('pointerleave', () => { card.style.transform = '' })
    }
  })

  const revealTargets = document.querySelectorAll('.collection, .intro-strip, .page-hero, .article, .archive-year')
  if ('IntersectionObserver' in window && !reduceMotion) {
    revealTargets.forEach((el) => el.classList.add('reveal'))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })
    revealTargets.forEach((el) => observer.observe(el))
  }
})
