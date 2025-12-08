"use client";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCarouselAutoplay } from "../hooks/useCarouselAutoplay";
import { HomepageCarouselItem } from "../types/carousel.types";

type HomeCarouselProps = {
  items: HomepageCarouselItem[];
};

export function HomeCarousel({ items }: HomeCarouselProps) {
  const autoplay = useCarouselAutoplay();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    const updateCurrent = () => {
      setCurrent(api.selectedScrollSnap());
    };

    // Set initial state
    updateCurrent();

    // Listen for changes
    api.on("select", updateCurrent);

    return () => {
      api.off("select", updateCurrent);
    };
  }, [api]);

  return (
    <Carousel
      className="w-full relative"
      plugins={[autoplay.current]}
      onMouseEnter={autoplay.current.stop}
      onMouseLeave={autoplay.current.reset}
      setApi={setApi}
    >
      <CarouselContent className="ml-0">
        {items.map((item) => (
          <CarouselItem key={item.id} className="pl-0">
            <div className="relative w-full h-[calc(100vh-104px)] min-h-[500px]">
              {/* Background Image */}
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.title || "Homepage hero slide"}
                  fill
                  className="object-cover"
                  priority
                  sizes="100vw"
                />
              )}
              
              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-black/50" />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-4">
                <div className="max-w-3xl space-y-6">
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                    {item.title}
                  </h2>
                  {item.description && (
                    <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                      {item.description}
                    </p>
                  )}
                  {/* Only render CTA when we have a non-null URL */}
                  {item.link && item.link.url && (
                    <div className="pt-4">
                      <Button
                        asChild
                        size="lg"
                        className="bg-primary hover:opacity-90 text-primary-foreground"
                      >
                        <Link
                          href={item.link.url}
                          target={item.link.isExternal ? "_blank" : undefined}
                          rel={item.link.isExternal ? "noreferrer" : undefined}
                        >
                          {item.link.title}
                          <span className="ml-2">→</span>
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4" />
      <CarouselNext className="right-4" />
      
      {/* Pagination Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={`h-2 rounded-full transition-all ${
              current === index
                ? "w-8 bg-white"
                : "w-2 bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </Carousel>
  );
}

