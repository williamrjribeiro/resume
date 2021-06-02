import 'focus-visible'

document.documentElement.classList.remove('no-js')

const onScroll =
    ({ scrollClassName, scrollTreshold }) =>
    () => {
        const isOverTreshold = window.scrollY > scrollTreshold

        if (isOverTreshold) {
            document.documentElement.classList.add(scrollClassName)
        } else {
            document.documentElement.classList.remove(scrollClassName)
        }
    }

const onScrollOptions = {
    scrollClassName: 'js-scrolled',
    scrollTreshold: 200
}

window.addEventListener('scroll', onScroll(onScrollOptions), { passive: true })

// When the user clicks on the avatar, scroll to the top of the document
document.querySelector('.vcard__avatar').addEventListener('click', () => {
    console.log('clicked on avatar!')
    document.body.scrollTop = 0 // For Safari
    document.documentElement.scrollTop = 0 // For Chrome, Firefox, IE and Opera
})

// Print Button
document.querySelector('.js-print').addEventListener('click', () => {
    window.print()
})
