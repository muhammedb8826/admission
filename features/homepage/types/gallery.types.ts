export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

export type HomepageGallerySection = {
  heading: string;
  title?: string;
  subTitle?: string;
  images: GalleryImage[];
};


