interface MapSectionProps {
  width?: string;
  height?: string;
  className?: string;
  showBorder?: boolean;
  variant?: 'card' | 'minimal' | 'embedded';
}

export default function MapSection({
  width = '100%',
  height = '400',
  className = '',
  showBorder = true,
  variant = 'embedded'
}: MapSectionProps) {
  const embedUrl = "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3327.1095734602736!2d-70.5668644!3d-33.4985262!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9662d100693cc665%3A0x6ce3fc6e45677cf9!2sHazuki%20Sushi%20Nikkei%20Quilin!5e0!3m2!1ses!2scl!4v1763857321625!5m2!1ses!2scl";

  const baseStyles = "rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:shadow-xl";

  const variantStyles = {
    card: `${baseStyles} border-4 ${showBorder ? 'border-orange-300' : 'border-transparent'}`,
    minimal: `${baseStyles} border border-gray-200`,
    embedded: `${baseStyles} ${showBorder ? 'shadow-xl' : ''}`
  };

  return (
    <div className={`${variantStyles[variant]} ${className}`} style={{ width, aspectRatio: height === '400' ? '16/10' : undefined }}>
      <iframe
        src={embedUrl}
        width={width === '100%' ? undefined : width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </div>
  );
}
