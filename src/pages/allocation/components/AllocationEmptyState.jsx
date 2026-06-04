import { useTranslation } from 'react-i18next'

function RoadIllustration() {
  return (
    <svg
      width="120"
      height="80"
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="text-[#94a3b8]"
    >
      <path
        d="M10 55 H110"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M30 55 L38 55 M50 55 L58 55 M70 55 L78 55 M90 55 L98 55"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 6"
      />
      <rect x="38" y="38" width="44" height="18" rx="4" fill="#cbd5e1" />
      <rect x="42" y="42" width="14" height="10" rx="2" fill="#e2e8f0" />
      <rect x="64" y="42" width="14" height="10" rx="2" fill="#e2e8f0" />
      <circle cx="46" cy="58" r="5" fill="#94a3b8" />
      <circle cx="74" cy="58" r="5" fill="#94a3b8" />
    </svg>
  )
}

function AllocationEmptyState({ variant = 'empty', i18nNamespace = 'allocation' }) {
  const { t } = useTranslation()
  const isPrompt = variant === 'prompt'

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <RoadIllustration />
      <p className="mt-4 text-center text-base font-medium text-[#374151]">
        {t(isPrompt ? `${i18nNamespace}.enterReservationHint` : `${i18nNamespace}.emptyTitle`)}
      </p>
      {isPrompt ? (
        <p className="mt-2 max-w-md text-center text-sm text-[#6b7280]">
          {t(`${i18nNamespace}.enterReservationHintSub`)}
        </p>
      ) : null}
    </div>
  )
}

export default AllocationEmptyState
