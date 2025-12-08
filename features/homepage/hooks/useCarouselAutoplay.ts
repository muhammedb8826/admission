"use client";

import React from "react";
import Autoplay, { AutoplayOptionsType } from "embla-carousel-autoplay";

type UseCarouselAutoplayOptions = Partial<AutoplayOptionsType>;

export function useCarouselAutoplay(options?: UseCarouselAutoplayOptions) {
  const plugin = React.useRef(
    Autoplay({
      delay: 2000,
      stopOnInteraction: true,
      ...options,
    })
  );

  return plugin;
}

