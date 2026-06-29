export function Pointslash({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 413 375"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        fillRule: "evenodd",
        clipRule: "evenodd",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeMiterlimit: 1.5,
      }}
    >
      <circle cx="75" cy="300" r="37.5" fill="currentColor" />
      <path
        d="M75,75l112.5,225.001"
        style={{ fill: "none", stroke: "currentColor", strokeWidth: "75px" }}
      />
      <path
        d="M187.5,75l75.002,0c41.42,0 74.998,33.578 74.998,74.998l-0,0.005c-0,41.42 -33.578,74.998 -74.998,74.998l-0.002,0l37.5,75.001"
        style={{ fill: "none", stroke: "currentColor", strokeWidth: "75px" }}
      />
    </svg>
  );
}
