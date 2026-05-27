/**
 * Compass Art — ilustração SVG premium para o hero do CEFIS Compass.
 *
 * Composição:
 * - Anel externo com graduações finas
 * - Anel intermediário com cardinal points (N, E, S, O)
 * - Agulha bicromática apontando nordeste (símbolo de progresso/direção)
 * - Ponto central com glow
 *
 * Paleta integrada ao site (brand emerald + accent amber + foreground).
 * Sem dependências externas, totalmente vetorial e responsivo.
 */
export function CompassArt({
  className = "",
  size = 480,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size, maxWidth: "100%" }}
      aria-hidden
    >
      {/* Glow externo radial */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, oklch(0.705 0.191 165.57 / 18%) 0%, transparent 60%)",
          filter: "blur(8px)",
        }}
      />

      <svg
        viewBox="0 0 480 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative w-full h-full"
      >
        <defs>
          {/* Gradiente da agulha: emerald → amber */}
          <linearGradient id="needle-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.705 0.191 165.57)" />
            <stop offset="100%" stopColor="oklch(0.765 0.182 76.81)" />
          </linearGradient>

          {/* Gradient sutil pro corpo */}
          <radialGradient id="body-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.20 0.03 264)" stopOpacity="1" />
            <stop offset="100%" stopColor="oklch(0.13 0.02 264)" stopOpacity="0.95" />
          </radialGradient>

          <filter id="needle-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Anel externo (corpo da bússola) */}
        <circle
          cx="240"
          cy="240"
          r="220"
          fill="url(#body-grad)"
          stroke="oklch(0.25 0.03 264)"
          strokeWidth="1"
        />

        {/* Graduações finas — 60 marcas */}
        <g stroke="oklch(0.40 0.03 264)" strokeWidth="1">
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = (i * 6 * Math.PI) / 180;
            const isMajor = i % 5 === 0;
            const r1 = 220;
            const r2 = isMajor ? 205 : 213;
            const x1 = 240 + r1 * Math.cos(angle);
            const y1 = 240 + r1 * Math.sin(angle);
            const x2 = 240 + r2 * Math.cos(angle);
            const y2 = 240 + r2 * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                strokeWidth={isMajor ? 1.5 : 0.8}
                opacity={isMajor ? 0.9 : 0.45}
              />
            );
          })}
        </g>

        {/* Anel intermediário */}
        <circle
          cx="240"
          cy="240"
          r="180"
          fill="none"
          stroke="oklch(0.30 0.03 264)"
          strokeWidth="1"
          strokeDasharray="2 4"
          opacity="0.6"
        />

        {/* Anel interno fino */}
        <circle
          cx="240"
          cy="240"
          r="150"
          fill="none"
          stroke="oklch(0.30 0.03 264)"
          strokeWidth="0.8"
          opacity="0.5"
        />

        {/* Cardinal points */}
        <g
          fill="oklch(0.65 0.02 264)"
          fontFamily="sans-serif"
          fontWeight="600"
          fontSize="20"
          textAnchor="middle"
        >
          <text x="240" y="58">N</text>
          <text x="440" y="248">L</text>
          <text x="240" y="438">S</text>
          <text x="40" y="248">O</text>
        </g>

        {/* Agulha apontando nordeste (progressão / aprendizagem ascendente) */}
        <g
          filter="url(#needle-glow)"
          transform="rotate(45 240 240)"
          opacity="0.95"
        >
          {/* Triângulo de cima (norte da agulha = ponta clara) */}
          <polygon
            points="240,80 226,240 254,240"
            fill="url(#needle-grad)"
          />
          {/* Triângulo de baixo (sul da agulha = tom escuro) */}
          <polygon
            points="240,400 226,240 254,240"
            fill="oklch(0.30 0.03 264)"
            opacity="0.7"
          />
        </g>

        {/* Pino central */}
        <circle
          cx="240"
          cy="240"
          r="14"
          fill="oklch(0.16 0.025 264)"
          stroke="oklch(0.705 0.191 165.57)"
          strokeWidth="2"
        />
        <circle cx="240" cy="240" r="5" fill="oklch(0.705 0.191 165.57)" />

        {/* Etiqueta "CEFIS COMPASS" sutil no anel */}
        <g
          fill="oklch(0.55 0.02 264)"
          fontFamily="sans-serif"
          fontWeight="700"
          fontSize="11"
          letterSpacing="3"
        >
          <text x="240" y="105" textAnchor="middle">
            CEFIS · COMPASS
          </text>
        </g>
      </svg>
    </div>
  );
}
