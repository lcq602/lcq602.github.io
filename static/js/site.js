document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const slides = [...carousel.querySelectorAll('.carousel-slide')]
    const dots = [...carousel.querySelectorAll('.carousel-dots button')]
    const previous = carousel.querySelector('.carousel-prev')
    const next = carousel.querySelector('.carousel-next')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
      if (!reduceMotion) timer = window.setInterval(() => show(active + 1), 5000)
    }

    previous.addEventListener('click', () => { show(active - 1); play() })
    next.addEventListener('click', () => { show(active + 1); play() })
    dots.forEach((dot, index) => dot.addEventListener('click', () => { show(index); play() }))
    carousel.addEventListener('mouseenter', stop)
    carousel.addEventListener('mouseleave', play)
    carousel.addEventListener('focusin', stop)
    carousel.addEventListener('focusout', play)
    carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { show(active - 1); play() }
      if (event.key === 'ArrowRight') { show(active + 1); play() }
    })

    show(0)
    play()
  })
})
