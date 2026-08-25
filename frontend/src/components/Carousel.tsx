import { useState, useEffect } from 'react';

interface CarouselImage {
  id: number;
  url: string;
  title: string;
  subtitle: string;
}

const carouselImages: CarouselImage[] = [
  {
    id: 1,
    url: '/images/sashimi.jpg',
    title: 'Sashimi Premium',
    subtitle: 'Ingredientes frescos del mejor sushi',
  },
  {
    id: 2,
    url: '/images/tempuras.jpg',
    title: 'Tempuras Caseras',
    subtitle: 'Crujientes por fuera, tiernas por dentro',
  },
  {
    id: 3,
    url: '/images/aji_de_gallina.jpg',
    title: 'Ají de Gallina',
    subtitle: 'Receta peruana tradicional',
  },
  {
    id: 4,
    url: '/images/40piezas.jpg',
    title: 'Tabla Premium',
    subtitle: '40 piezas de sushi variado',
  },
  {
    id: 5,
    url: '/images/cevicheroll-hazuki.jpg',
    title: 'Ceviche Roll',
    subtitle: 'Fusión de sabores peruanos',
  },
];

export default function Carousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlay]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 10000);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 10000);
  };

  const currentImage = carouselImages[currentSlide];

  return (
    <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-80 md:h-96 lg:h-[500px] overflow-hidden group">
      {/* Carousel Images */}
      {carouselImages.map((image, index) => (
        <div
          key={image.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url(${image.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ))}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Content - Aligned to bottom like reference */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-end text-white text-center px-4 pb-8 md:pb-12">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-2 drop-shadow-lg">
          {currentImage.title}
        </h2>
        <p className="text-sm md:text-base text-gray-100 drop-shadow-md">
          {currentImage.subtitle}
        </p>
      </div>

      {/* Previous Button */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 md:left-6 top-1/2 transform -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 md:p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
        aria-label="Previous slide"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next Button */}
      <button
        onClick={goToNext}
        className="absolute right-4 md:right-6 top-1/2 transform -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 md:p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
        aria-label="Next slide"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex gap-2">
        {carouselImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide
                ? 'bg-white w-6 md:w-8 h-2 md:h-3'
                : 'bg-white/50 w-2 md:w-3 h-2 md:h-3 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute top-4 md:top-6 right-4 md:right-6 z-30 bg-black/40 backdrop-blur-sm text-white px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-semibold">
        {currentSlide + 1} / {carouselImages.length}
      </div>
    </div>
  );
}
