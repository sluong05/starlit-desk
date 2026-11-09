/**
 * Lumi, the Starlit Desk moon-cat. An original little character who peeks
 * over cards, waits with you for your friend, and waves hello.
 */
export default function Mascot({ pose = "sit", size = 96 }: { pose?: "sit" | "peek" | "wave"; size?: number }) {
  const peek = pose === "peek";
  return (
    <svg className={`mascot mascot-${pose}`} width={size} height={peek ? size * 0.62 : size} viewBox={peek ? "0 0 120 74" : "0 0 120 120"} aria-hidden="true">
      <g className="mascot-bob">
        {!peek && (
          <>
            <path className="mascot-tail" d="M88 98 q 26 2 22 -22" fill="none" stroke="#ffe2a8" strokeWidth="9" strokeLinecap="round" />
            <ellipse cx="60" cy="92" rx="34" ry="26" fill="#fff3d6" />
            <ellipse cx="60" cy="98" rx="18" ry="14" fill="#ffffff" opacity="0.7" />
          </>
        )}
        {/* ears */}
        <path d="M26 30 L30 4 L52 20 Z M94 30 L90 4 L68 20 Z" fill="#fff3d6" />
        <path d="M31 24 L33 11 L45 20 Z M89 24 L87 11 L75 20 Z" fill="#ffc9a8" />
        {/* head */}
        <ellipse cx="60" cy="44" rx="38" ry="32" fill="#fff3d6" />
        {/* star mark */}
        <path d="M60 17 l2.6 5.600 6.100 .700 -4.500 4.200 1.200 6 -5.400 -3 -5.400 3 1.200 -6 -4.500 -4.200 6.100 -.700 Z" fill="#ffc94d" />
        {/* face */}
        <g className="mascot-eyes" stroke="#4a3a5e" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M40 46 q 5 -6 10 0 M70 46 q 5 -6 10 0" />
        </g>
        <ellipse cx="34" cy="54" rx="6" ry="4" fill="#ffb3b3" opacity="0.7" />
        <ellipse cx="86" cy="54" rx="6" ry="4" fill="#ffb3b3" opacity="0.7" />
        <path d="M57 52 h6 l-3 3.500 Z" fill="#e58a8a" />
        <path d="M60 55.500 q -4 5 -8 1 M60 55.500 q 4 5 8 1" stroke="#4a3a5e" strokeWidth="2.200" strokeLinecap="round" fill="none" />
        {/* paws */}
        {peek ? (
          <>
            <ellipse cx="36" cy="72" rx="11" ry="7" fill="#ffffff" />
            <ellipse cx="84" cy="72" rx="11" ry="7" fill="#ffffff" />
          </>
        ) : (
          <>
            <ellipse cx="46" cy="114" rx="10" ry="6" fill="#ffffff" />
            {pose === "wave" ? <ellipse className="mascot-paw" cx="92" cy="72" rx="8" ry="11" fill="#ffffff" /> : <ellipse cx="74" cy="114" rx="10" ry="6" fill="#ffffff" />}
          </>
        )}
      </g>
    </svg>
  );
}
