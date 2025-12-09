import {
  HomeCarousel,
  WhyYouShouldJoinSection,
  HomepageStoriesSection,
  HomepageNotableAlumni,
  HomepageNewsBlogs,
  HowToApply,
  getHomepageCarouselItems,
  getHomepageWhyJoinSection,
  getHomepageStories,
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
    storiesData,
    gallerySection,
    howToApplySection,
    notableAlumniSection,
    newsBlogsSection,
  ] =
    await Promise.allSettled([
      getHomepageCarouselItems(),
      getHomepageWhyJoinSection(),
      getHomepageStories(),
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
      <HomepageStoriesSection
        data={storiesData.status === "fulfilled" ? storiesData.value : {}}
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

