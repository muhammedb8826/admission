import {
  HomeCarousel,
  WhyYouShouldJoinSection,
  HomepageNotableAlumni,
  HomepageNewsBlogs,
  HowToApply,
  getHomepageCarouselItems,
  getHomepageWhyJoinSection,
  getHomepageNotableAlumni,
  getHomepageNewsBlogs,
  getHowToApplySection,
} from "@/features/homepage";
import { HomepageGallery } from "@/features/homepage/components/HomepageGallery";
import { getHomepageGallerySection } from "@/features/homepage/api/gallery.api";

export default async function Home() {
  const [
    carouselItems,
    whyJoinSection,
    gallerySection,
    howToApplySection,
    notableAlumniSection,
    newsBlogsSection,
  ] =
    await Promise.allSettled([
      getHomepageCarouselItems(),
      getHomepageWhyJoinSection(),
      getHomepageGallerySection(),
      getHowToApplySection(),
      getHomepageNotableAlumni(),
      getHomepageNewsBlogs(),
    ]);

  return (
    <div className="w-full">
      <HomeCarousel
        items={carouselItems.status === "fulfilled" ? carouselItems.value : []}
      />
   
   


      <WhyYouShouldJoinSection
        section={whyJoinSection.status === "fulfilled" ? whyJoinSection.value : null}
      />
      <HomepageGallery
        section={gallerySection.status === "fulfilled" ? gallerySection.value : null}
      />
      <HowToApply
        section={howToApplySection.status === "fulfilled" ? howToApplySection.value : null}
      />
      <HomepageNotableAlumni
        section={
          notableAlumniSection.status === "fulfilled" ? notableAlumniSection.value : null
        }
      />
      <HomepageNewsBlogs
        section={
          newsBlogsSection.status === "fulfilled" ? newsBlogsSection.value : null
        }
      />
    </div>
  );
}

