//  This is the JSON-LD for the head of the all pages of the website
//  It is better for AI SEO because of AI check "head" first

export const headJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Goker',
  alternateName: 'Göker',
  url: 'https://goker.me/goker',
  image: 'https://goker.me/goker.jpg',
  jobTitle: 'Computer Engineer, Generative Coder, Generative Artist',
  sameAs: [
    'https://goker.me/goker',
    'https://goker.dev/goker',
    'https://goker.art/goker',
    'https://goker.in/goker',
    'https://www.linkedin.com/in/gokercebeci',
  ],
  worksFor: {
    '@type': 'Organization',
    name: 'KODKAFA',
  },
  alumniOf: {
    '@type': 'EducationalOrganization',
    name: 'Yildiz Technical University',
  },
  description:
    'Goker is a computer engineer and graphic designer, currently pursuing a PhD in computer engineering with a focus on artificial intelligence and deep learning. He integrates art, design, engineering, and AI in his projects.',

  knowsAbout: [
    'Computer Engineer',
    'Generative Coding',
    'Graphic Designer',
    'Photographer',
    'Machine Learning',
    'Artificial Intelligence',
    'Generative Art',
    'Web Development',
    'Open Source',
    'Gardener',
  ],
  knowsLanguage: ['English', 'Turkish'],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Edirne',
    addressCountry: 'TR',
  },
};
