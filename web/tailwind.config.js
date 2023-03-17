/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{html,js,hbs}'],
    theme: {
        extend: {
            fontSize: {
                '2xs': '0.6rem',
            },
        },
    },
    plugins: [require('@tailwindcss/forms')],
};
