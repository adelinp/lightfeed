const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "LightFeed";

export default function Logo() {
  const color = "currentColor";

  return (
    <svg
      width="170"
      height="24"
      viewBox="0 0 170 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0" y="0" width="24" height="24" rx="6" fill={color} opacity="0.12" />
      <circle cx="7" cy="17" r="2" fill={color} />
      <path
        d="M6.5 10.5C10 10.5 13 13.5 13 17"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.5 5.5C12.8 5.5 18 10.7 18 17"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <text
        x="34"
        y="16"
        fill={color}
        fontSize="14"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {siteName}
      </text>
    </svg>
  );
}