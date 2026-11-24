export interface DesignWork {
  id: string
  title: string
  category?: string
  description?: string
  image: string
  year?: string
  featured?: boolean
}

/**
 * Drop your real files into:
 *   public/images/graphic-design/design-01.jpg … design-15.jpg
 * (or .webp / .png) and update the `image` paths below.
 * Titles / categories can be edited here without touching the gallery component.
 */
export const designWorks: DesignWork[] = [
  {
    id: 'visual-01',
    title: 'Visual Study 01',
    category: 'Graphic Design',
    image: '/images/graphic-design/design-01.png',
    featured: true,
  },
  {
    id: 'visual-02',
    title: 'Visual Study 02',
    category: 'Graphic Design',
    image: '/images/graphic-design/design-02.png',
  },
  {
    id: 'visual-03',
    title: 'Visual Study 03',
    category: 'Graphic Design',
    image: '/images/graphic-design/design-03.png',
  },
  {
    id: 'visual-04',
    title: 'Visual Study 04',
    category: 'Graphic Design',
    image: '/images/graphic-design/design-04.png',
    featured: true,
  },
  {
    id: 'visual-05',
    title: 'Visual Study 05',
    category: 'Graphic Design',
    image: '/images/graphic-design/design-05.png',
  },
  {
    id: 'visual-06',
    title: 'Visual Study 06',
    category: 'Graphic Design',
    image: '/images/graphic-design/design-06.png',
  },
  {
    id: 'visual-07',
    title: 'Visual Study 07',
    category: 'Graphic Design',
    image: '/images/graphic-design/design-07.png',
  },
  {
    id: 'visual-08',
    title: 'Visual Study 08',
    category: 'Graphic Design',
    image: '/images/graphic-design/design-08.png',
  },
  {
    id: 'visual-09',
    title: 'Visual Study 09',
    category: 'Graphic Design',
    image: '/images/graphic-design/design-09.png',
  },
  {
    id: 'visual-10',
    title: 'Visual Study 10',
    category: 'Graphic Design',
    image: '/images/graphic-design/design-10.png',
    featured: true,
  },
  {
    id: 'visual-11',
    title: 'Visual Study 11',
    category: 'Graphic Design',
    image: '/images/graphic-design/design-11.png',
  },
  {
    id: 'visual-12',
    title: 'Visual Study 12',
    category: 'Graphic Design',
    image: '/images/graphic-design/design-12.png',
  },
  {
    id: 'visual-13',
    title: 'Visual Study 13',
    category: 'Graphic Design',
    image: '/images/graphic-design/design-13.png',
  },
  {
    id: 'visual-14',
    title: 'Visual Study 14',
    category: 'Graphic Design',
    image: '/images/graphic-design/design-14.png',
  },
  {
    id: 'visual-15',
    title: 'Visual Study 15',
    category: 'Graphic Design',
    image: '/images/graphic-design/design-15.png',
  },
]
