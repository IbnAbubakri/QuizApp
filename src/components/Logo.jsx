export default function Logo({ size = 34, withText = false, tone = 'default' }) {
  return (
    <span className={`logo ${withText ? 'logo--with-text' : ''}`}>
      <svg
        className="logo-mark"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect
          width="48"
          height="48"
          rx="13"
          fill="var(--logo-fill, var(--brand))"
        />
        <circle cx="21" cy="21.5" r="8.8" stroke="#fff" strokeWidth="3.4" />
        <path
          d="M27.2 27.7 L33.4 33.9"
          stroke="#fff"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <circle cx="21" cy="21.5" r="2.3" fill="#fff" />
      </svg>
      {withText && (
        <span className={`logo-text logo-text--${tone}`}>QuizApp</span>
      )}
    </span>
  )
}
