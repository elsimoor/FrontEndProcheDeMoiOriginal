// postcss.config.js  (ou .cjs/.mjs)
module.exports = {
  /**  Vous pouvez laisser d’autres options (parser, map…) ici. */

  plugins: {
    tailwindcss: {},      // Tailwind  ➜  lit tailwind.config.*
    autoprefixer: {},     // Ajoute les préfixes navigateurs
    /* Ajoutez vos plugins éventuels ici */
  },
};
